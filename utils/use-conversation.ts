import { useEffect, useRef, useState } from "react";
import {
  Client as ConversationClient,
  Conversation,
} from "@twilio/conversations";

export function useConversation() {
  const convClient = useRef<ConversationClient>();
  const [clientState, setClientState] = useState<{
    statusString?: string;
    status?: string;
    conversationsReady?: boolean;
  }>();
  const [conversations, setConversations] = useState<Conversation[]>();
  const [selectedConversation, setSelectedConversation] = useState<
    Conversation
  >();

  useEffect(() => {
    const dataToken = localStorage.getItem("tokenSaved");
    if (!dataToken) return;
    const { token, signInAt } = JSON.parse(dataToken);
    if(new Date(signInAt).getTime() + 3600000 < new Date().getTime()) {
      localStorage.removeItem("tokenSaved");
      return;
    }
    convClient.current = new ConversationClient(token);
    afterSignIn();
    return () => {}
  }, [])
  

  const getToken = async (username: string, password: string) => {
    const url = process.env.NEXT_PUBLIC_URL_SERVICE;
    const response = await fetch(
      `${url}?identity=${username}&password=${password}`,
    );
    const data = await response.text();
    return data;
  };

  const signIn = async (username: string, password: string) => {
    const token = await getToken(username, password);
    localStorage.setItem('tokenSaved', JSON.stringify({
      token,
      signInAt: new Date()
    }));
    
    convClient.current = new ConversationClient(token);
    afterSignIn();
    return convClient.current;
  };

  const afterSignIn = () => {
    setListener();
  }

  const setListener = () => {
    if (!convClient.current) return;

    convClient.current.on("connectionStateChanged", (state) => {
      if (state === "connecting") {
        setClientState({
          statusString: "Connecting to Twilio…",
          status: "default",
        });
      }
      if (state === "connected") {
        setClientState({
          statusString: "You are connected.",
          status: "success",
        });
        getListConversation();
      }
      if (state === "disconnecting") {
        setClientState({
          statusString: "Disconnecting from Twilio…",
          conversationsReady: false,
          status: "default",
        });
      }
      if (state === "disconnected") {
        setClientState({
          statusString: "Disconnected.",
          conversationsReady: false,
          status: "warning",
        });
      }
      if (state === "denied") {
        setClientState({
          statusString: "Failed to connect.",
          conversationsReady: false,
          status: "error",
        });
      }
    });
    convClient.current.on("conversationJoined", (conversation) => {
      setConversations((prev) => {
        const isExist = prev?.find((conv) => conv.sid === conversation.sid);
        if (isExist) return prev;
        if(!prev) return [conversation];
        return [...prev, conversation];
      });
    });
    convClient.current.on("conversationLeft", (thisConversation) => {
      setConversations((prev) => {
        if (!prev) return prev;
        return prev.filter((conversation) => conversation !== thisConversation);
      });
    });
    convClient.current.on("messageAdded", (message) => {
      console.log(`New message, from ${message.author}, ${message.conversation.sid} : ${message.body}`);
      getListConversation();
    })
  };

  const getListConversation = async () => {
    const listConversationFinal = []
    if(!convClient.current) return;
    let listConversation = await convClient.current?.getSubscribedConversations();
    if(!listConversation) return;
    listConversationFinal.push(...listConversation.items);
    while(listConversation?.hasNextPage){
      listConversation = await listConversation.nextPage();
      listConversationFinal.push(...listConversation.items);
    }
    listConversationFinal.sort((a, b) => {
      const aLastMessage = a.lastMessage?.dateCreated?.getTime() || 0;
      const bLastMessage = b.lastMessage?.dateCreated?.getTime() || 0;
      return bLastMessage - aLastMessage;
    })
    setConversations(listConversationFinal);
  }

  const createConversation = async (uniqueName: string) => {
    let newConversation: Conversation| undefined;
    try{
      newConversation = await convClient.current?.createConversation({
        uniqueName,
      });
      newConversation?.join();
      return newConversation;
    } catch(e){
      console.log(e);
      console.log('Failed create conversation ' + uniqueName);
      alert("Failed create conversation "+ uniqueName);
    }
  }

  const signOut = () => {
    convClient.current?.shutdown();
    localStorage.removeItem("tokenSaved");
    setClientState(undefined);
    setConversations(undefined);
    setSelectedConversation(undefined);
  }

  return {
    signIn,
    convClientState: clientState,
    conversations,
    selectedConversation,
    setSelectedConversation,
    joinOrCreateConverstaion: createConversation,
    signOut,
  };
}
