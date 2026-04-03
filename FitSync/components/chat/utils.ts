import { IMessage } from 'react-native-gifted-chat';
import { BOT_USER, BOT_ID } from './constants';

export function makeMsg(
  text: string,
  isBot: boolean,
  uid: string,
  displayName: string,
  id?: string,
): IMessage {
  return {
    _id: id ?? `${isBot ? 'b' : 'u'}_${Date.now()}_${Math.random()}`,
    text,
    createdAt: new Date(),
    user: isBot
      ? BOT_USER
      : { _id: uid, name: displayName },
  };
}
