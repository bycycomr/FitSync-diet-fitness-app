import { IMessage } from 'react-native-gifted-chat';

export const BOT_ID = 'fitsync-ai';

export const BOT_USER = {
  _id: BOT_ID,
  name: 'FitSync AI',
  avatar: undefined as undefined,
};

export const WELCOME_MSG: IMessage = {
  _id: '__welcome__',
  text: 'Merhaba! 👋 Ben FitSync AI asistanın.\n\nBeslenme planın, antrenman programın veya kilo hedeflerin hakkında sana yardımcı olmaya hazırım. Ne öğrenmek istersin?',
  createdAt: new Date(),
  user: BOT_USER,
};
