import { useConversation } from "@/utils/use-conversation"
import { Conversation, Message, Client as ConversationClient, } from "@twilio/conversations";
import { useEffect, useState } from "react";

export default function Home() {
  const client = useConversation();

  return (
    <main>
      <div className="flex gap-6 p-6">
        <div className="w-1/2">
          <FormUser isDisabled={client.convClientState?.status === 'success'} onSubmit={(e) => {
            const username = e.currentTarget.username.value
            const password = e.currentTarget.password.value
            client.signIn(username, password);
          }} />
        </div>
        <div className="w-1/2 mt-12">
          <div className="border-2 border-gray-100 rounded-lg p-3">
            <div>
              Status : {client.convClientState?.status ?? '-'}
            </div>
            <div>
              conversationsReady : {client.convClientState?.conversationsReady ?? '-'}
            </div>
            <div>
              statusString : {client.convClientState?.statusString ?? '-'}
            </div>
          </div>
          <div className="border-2 border-gray-100 rounded-lg p-3 mt-2">
            <h3 className="text-md font-bold">Join Room</h3>
            <input type="text" className="input input-bordered w-full mt-2" placeholder="Room Name Unique" onKeyDown={(e) => {
              e.key === 'Enter' && client.joinOrCreateConverstaion(e.currentTarget.value)
            }} />
          </div>
        </div>
      </div>
      <ConversationManager
        conversations={client.conversations ?? []}
        onClickConversation={(conv) => {
          client.setSelectedConversation(conv);
        }}
        selectedConversation={client.selectedConversation}
      />
    </main>
  )
}

function FormUser({ isDisabled, onSubmit }: {
  isDisabled: boolean,
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSubmit(e)
    }} className="m-3 w-full">
      <h3 className="text-xl mb-3 font-bold">
        Form User
      </h3>
      <div className="flex flex-col gap-3">
        <input disabled={isDisabled} type="text" name="username" className="input input-bordered" placeholder="username" />
        <input disabled={isDisabled} type="password" name="password" className="input input-bordered" placeholder="Password" />
        <button disabled={isDisabled} className="btn btn-primary">
          Login
        </button>
      </div>
    </form>
  )
}

function ConversationManager({ conversations, onClickConversation, selectedConversation }: {
  conversations: Conversation[],
  onClickConversation: (conversation: Conversation) => void,
  selectedConversation?: Conversation,
}) {

  useEffect(() => {
    if (conversations.length > 0) {
      onClickConversation(conversations[0]);
    }
  }, [])

  return (
    <div className="flex m-3 gap-3">
      <div className="w-4/12 border-2 p-3 border-gray-200 rounded-lg flex flex-col max-h-[80vh] overflow-auto">
        {conversations.map((item, index) => (
          <ConversationTag key={item.sid} conversation={item} onClick={onClickConversation}/>
        ))}
      </div>
      <div className="w-8/12 border-2 border-gray-200 rounded-lg">
        {selectedConversation && <ChatRoom key={selectedConversation.sid} conversation={selectedConversation} />}
      </div>
    </div>
  )
}

function ConversationTag({conversation, onClick}: {conversation: Conversation, onClick: (conversation: Conversation) => void}){
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    conversation.getMessages(1).then((message) => {
      setMessages(message.items);
    })
    conversation.on('updated', ({updateReasons,conversation}) => {
      console.log(`${conversation.sid}, do update with reason ${updateReasons.join(',')}`);
      conversation.getMessages(1).then((message) => {
        setMessages(message.items);
      })
      // setMessages([messsage]);
    })
  }, [])

  const shortMessage = (message: string) => {
    return message.length > 20 ? message.substring(0, 20) + '...' : message;
  }

  return (
    <div className="flex gap-3 border-2 border-white hover:border-gray-100 p-2 cursor-pointer"
      onClick={() => onClick(conversation)}
    >
      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
      <div className="flex flex-col">
        <span className="font-bold">
          {conversation.uniqueName}
        </span>
        {messages[0] && <span className="text-sm">
          {messages[0]?.author} : {shortMessage(messages[0]?.body ?? '-')}
        </span>}
      </div>
    </div>
  )
}

function ChatRoom({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    conversation.getMessages().then((message) => {
      setMessages(message.items);
    })
    conversation.on('messageAdded', (message) => {
      setMessages((prev) => {
        if(prev?.find(item => message.sid === item.sid)){
          return prev;
        }
        return [...prev, message];
      });
    })
  }, [])

  return (
    <div className="flex flex-col max-h-[80vh]">
      <div className="h-24 flex items-center gap-3 shadow-sm p-3">
        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
        <span className="font-bold">
          {conversation.uniqueName}
        </span>
      </div>
      <div className="overflow-auto p-3">
        {
          messages.map((message) => {
            return (
              <div key={message.sid} className="chat chat-start">
                <div className="chat-header">
                  {message.author}
                  <time className="text-xs opacity-50 ml-2">{message.dateCreated?.toLocaleDateString()}</time>
                </div>
                <div className="chat-bubble">{message.body}</div>
              </div>
            )
          })
        }
      </div>
      <div className="mt-3 p-3">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Chat here"
          onKeyDown={(e) => {
            if(e.key === 'Enter') {
              conversation.sendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  )
}

