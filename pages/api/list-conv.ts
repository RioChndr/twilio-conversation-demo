import { NextApiRequest, NextApiResponse } from "next";

export default function Handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  const list = [
    {
      "sid": "CH22d8557d59ce427688c8082c17611acc",
      "uniqueName": "room-2",
    },
    {
      "sid": "CHc6bb9cec857142ff80481f9c78a0fd19",
      "uniqueName": "mas mas random",
    },
    {
      "sid": "CH44f3879d0cf446999f80ac1b8e7bb046",
      "uniqueName": "Room-1\\",
    },
    {
      "sid": "CHb1a4abf631da433cad4df5789f0b2c4c",
      "uniqueName": "room-3",
    },
    {
      "sid": "CH562efabf28a4409b968fec3bed3915e6",
      "uniqueName": "test123123",
    },
  ];
  res.status(200).json(list);
}
