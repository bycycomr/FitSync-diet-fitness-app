// Type stub for react-native-gifted-chat
// The library ships .tsx source files with React Native version incompatibilities.
// We redeclare the module with the types we actually use to avoid internal errors.

import type {
  StyleProp,
  TextStyle,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import type React from 'react';

declare module 'react-native-gifted-chat' {
  export interface IMessage {
    _id: string | number;
    text: string;
    createdAt: Date | number;
    user: User;
    image?: string;
    video?: string;
    audio?: string;
    system?: boolean;
    sent?: boolean;
    received?: boolean;
    pending?: boolean;
    quickReplies?: QuickReplies;
  }

  export interface User {
    _id: string | number;
    name?: string;
    avatar?: string | number | ((props: AvatarProps<IMessage>) => React.ReactNode);
  }

  export interface LeftRightStyle<T> {
    left?: StyleProp<T>;
    right?: StyleProp<T>;
  }

  export interface QuickReplies {
    type: 'radio' | 'checkbox';
    values: Reply[];
    keepIt?: boolean;
  }

  export interface Reply {
    title: string;
    value: string;
    messageId?: IMessage['_id'];
  }

  export interface BubbleProps<TMessage extends IMessage = IMessage> {
    position?: 'left' | 'right';
    currentMessage?: TMessage;
    nextMessage?: TMessage;
    previousMessage?: TMessage;
    user?: User;
    wrapperStyle?: LeftRightStyle<ViewStyle>;
    textStyle?: LeftRightStyle<TextStyle>;
    bottomContainerStyle?: LeftRightStyle<ViewStyle>;
    tickStyle?: StyleProp<TextStyle>;
    containerStyle?: LeftRightStyle<ViewStyle>;
    [key: string]: unknown;
  }

  export interface InputToolbarProps<TMessage extends IMessage = IMessage> {
    containerStyle?: StyleProp<ViewStyle>;
    primaryStyle?: StyleProp<ViewStyle>;
    accessoryStyle?: StyleProp<ViewStyle>;
    [key: string]: unknown;
  }

  export interface SendProps<TMessage extends IMessage = IMessage> {
    text?: string;
    label?: string;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    alwaysShowSend?: boolean;
    isSendButtonAlwaysVisible?: boolean;
    disabled?: boolean;
    sendButtonProps?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface AvatarProps<TMessage extends IMessage = IMessage> {
    currentMessage?: TMessage;
    nextMessage?: TMessage;
    previousMessage?: TMessage;
    position?: 'left' | 'right';
    renderAvatarOnTop?: boolean;
    showAvatarForEveryMessage?: boolean;
    containerStyle?: LeftRightStyle<ViewStyle>;
    imageStyle?: LeftRightStyle<ViewStyle>;
    onPressAvatar?: (user: User) => void;
    onLongPressAvatar?: (user: User) => void;
    renderAvatar?: ((props: AvatarProps<TMessage>) => React.ReactNode) | null;
    [key: string]: unknown;
  }

  export interface GiftedChatProps<TMessage extends IMessage = IMessage> {
    messages?: TMessage[];
    onSend?: (messages: TMessage[]) => void;
    user?: User;
    locale?: string;
    isUserAvatarVisible?: boolean;
    isSendButtonAlwaysVisible?: boolean;
    isAvatarVisibleForEveryMessage?: boolean;
    isAvatarOnTop?: boolean;
    isUsernameVisible?: boolean;
    messagesContainerStyle?: StyleProp<ViewStyle>;
    textInputProps?: Partial<TextInputProps>;
    timeFormat?: string;
    dateFormat?: string;
    messageIdGenerator?: (message?: TMessage) => string;
    renderBubble?: (props: BubbleProps<TMessage>) => React.ReactNode;
    renderInputToolbar?: (props: InputToolbarProps<TMessage>) => React.ReactNode;
    renderSend?: (props: SendProps<TMessage>) => React.ReactNode;
    renderAvatar?: ((props: AvatarProps<TMessage>) => React.ReactNode) | null;
    renderDay?: (props: Record<string, unknown>) => React.ReactNode;
    renderFooter?: () => React.ReactNode;
    renderSystemMessage?: (props: Record<string, unknown>) => React.ReactNode;
    timeTextStyle?: LeftRightStyle<TextStyle>;
    keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
    bottomOffset?: number;
    minInputToolbarHeight?: number;
    minComposerHeight?: number;
    maxComposerHeight?: number;
    onPressAvatar?: (user: User) => void;
    onLongPressAvatar?: (user: User) => void;
    [key: string]: unknown;
  }

  export class GiftedChat<TMessage extends IMessage = IMessage> extends React.Component<GiftedChatProps<TMessage>> {
    static append<TMessage extends IMessage>(
      currentMessages: TMessage[],
      messages: TMessage[],
      inverted?: boolean,
    ): TMessage[];
    static prepend<TMessage extends IMessage>(
      currentMessages: TMessage[],
      messages: TMessage[],
      inverted?: boolean,
    ): TMessage[];
  }

  export class Bubble<TMessage extends IMessage = IMessage> extends React.Component<BubbleProps<TMessage>> {}
  export class InputToolbar<TMessage extends IMessage = IMessage> extends React.Component<InputToolbarProps<TMessage>> {}
  export class Send<TMessage extends IMessage = IMessage> extends React.Component<SendProps<TMessage>> {}
  export class Avatar<TMessage extends IMessage = IMessage> extends React.Component<AvatarProps<TMessage>> {}
  export class Day extends React.Component<Record<string, unknown>> {}
  export class SystemMessage extends React.Component<Record<string, unknown>> {}
}
