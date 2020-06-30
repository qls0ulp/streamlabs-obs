import { ITwitchChannelInfo, ITwitchStartStreamOptions, TwitchService } from './twitch';
import { IYoutubeStartStreamOptions, YoutubeService } from './youtube';
import { IMixerChannelInfo, IMixerStartStreamOptions, MixerService } from './mixer';
import { FacebookService, IFacebookChannelInfo, IFacebookStartStreamOptions } from './facebook';
import { TTwitchTag } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';
import { Observable } from 'rxjs';
import { IPlatformResponse } from './utils';
import { IInputMetadata } from '../../components/shared/inputs';
import { IGoLiveSettings } from '../streaming';

export type Tag = TTwitchTag;
export interface IGame {
  name: string;
}

/** Authorization scope **/
type TOAuthScope = TTwitchOAuthScope;

/** Supported capabilities of the streaming platform **/
export type TPlatformCapabilityMap = {
  /** Display and interact with chat **/
  chat: IPlatformCapabilityChat;
  /** Ability to set the stream description **/
  description: IPlatformCapabilityDescription;
  /** Ability to set the stream game **/
  game: IPlatformCapabilityGame;
  /** Fetch and set stream tags **/
  tags: IPlatformCapabilityTags;
  /** Fetch and set user information **/
  'user-info': IPlatformCapabilityUserInfo;
  /** Schedule streams for a latter date **/
  'stream-schedule': IPlatformCapabilityScheduleStream;
  /** Ability to check whether we're authorized to perform actions under a given scope **/
  'scope-validation': IPlatformCapabilityScopeValidation;
  /** This service supports Streamlabs account merging within SLOBS **/
  'account-merging': IPlatformCapabilityAccountMerging;
};

export type TPlatformCapability = keyof TPlatformCapabilityMap;

interface IPlatformCapabilityChat {
  getChatUrl: (mode: string) => Promise<string>;
}

interface IPlatformCapabilityGame {
  state: { settings: { game: string } };
}

interface IPlatformCapabilityDescription {
  state: { settings: { description: string } };
}

interface IPlatformCapabilityTags {
  getAllTags: () => Promise<Tag[]>;
  getStreamTags: () => Promise<Tag[]>;
  setStreamTags: () => Promise<any>;
}

interface IPlatformCapabilityUserInfo {
  fetchUserInfo: () => Promise<IUserInfo>;
}

interface IPlatformCapabilityScheduleStream {
  scheduleStream: (startTime: string, info: TChannelInfo) => Promise<any>;
}

interface IPlatformCapabilityScopeValidation {
  hasScope: (scope: TOAuthScope) => Promise<boolean>;
}

interface IPlatformCapabilityAccountMerging {
  mergeUrl: string;
}

/**
 * Returned from certain platform methods where particular errors
 * may require special handling.
 */
export enum EPlatformCallResult {
  /**
   * The call succeeded
   */
  Success,

  /**
   * A generic error occurred
   */
  Error,

  /**
   * The user does not have 2FA enabled on their Twitch account
   */
  TwitchTwoFactor,

  /**
   * The user does not have live-streaming enabled on their Youtube account
   */
  YoutubeStreamingDisabled,

  /**
   * The user is missing an essential Twitch scope.
   */
  TwitchScopeMissing,
}

export type TStartStreamOptions =
  | ITwitchStartStreamOptions
  | IYoutubeStartStreamOptions
  | Partial<IFacebookStartStreamOptions>
  | IMixerStartStreamOptions;

export type TChannelInfo = ITwitchChannelInfo | Partial<IFacebookChannelInfo> | IMixerChannelInfo;

// state applicable for all platforms
export interface IPlatformState {
  viewersCount: number;
  streamKey: string;
  settings: TStartStreamOptions;
  streamPageUrl: string;
  chatUrl: string;
  isPrepopulated: boolean;
}

// All platform services should implement this interface.
export interface IPlatformService {
  capabilities: Set<TPlatformCapability>;

  authWindowOptions: Electron.BrowserWindowConstructorOptions;

  authUrl: string;

  /**
   * Check the user's ability to stream for the current platform
   */
  validatePlatform: () => Promise<EPlatformCallResult>;

  fetchUserInfo: () => Promise<IUserInfo>;

  putChannelInfo: (channelInfo: TStartStreamOptions) => Promise<boolean>;

  searchGames: (searchString: string) => Promise<IGame[]>;

  /**
   * Sets up the stream key and live broadcast info required to go live.
   */
  beforeGoLive: (options: IGoLiveSettings) => Promise<void>;

  afterGoLive?: () => Promise<void>;

  afterStopStream?: () => Promise<void>;

  prepopulateInfo: () => Promise<unknown>;

  scheduleStream?: (startTime: string, info: TChannelInfo) => Promise<any>;

  fetchNewToken: () => Promise<void>;

  getHeaders: (
    req: IPlatformRequest,
    useToken?: boolean | string,
  ) => Dictionary<string | undefined>;

  liveDockEnabled: () => boolean;

  readonly platform: TPlatform;
  readonly displayName: string;
  readonly mergeUrl: string;
  readonly chatUrl: string;
  unlink: () => void;

  state: IPlatformState;
}

export interface IUserAuth {
  widgetToken: string;
  apiToken: string; // Streamlabs API Token

  /**
   * Old key from when SLOBS only supported a single platform account
   * @deprecated Use `platforms` instead
   */
  platform?: IPlatformAuth;

  /**
   * The primary platform used for chat, go live window, etc
   */
  primaryPlatform: TPlatform;

  /**
   * New key that supports multiple logged in platforms
   */
  platforms?: { [platform in TPlatform]?: IPlatformAuth };

  /**
   * Session partition used to separate cookies associated
   * with this user login.
   */
  partition?: string;
}

export interface IPlatformAuth {
  type: TPlatform;
  username: string;
  token: string;
  id: string;
  channelId?: string;
}

export interface IUserInfo {
  username?: string;
}

export type TPlatform = 'twitch' | 'youtube' | 'mixer' | 'facebook';

export function getPlatformService(platform: TPlatform): IPlatformService {
  return {
    twitch: TwitchService.instance,
    youtube: YoutubeService.instance,
    mixer: MixerService.instance,
    facebook: FacebookService.instance,
  }[platform];
}

export interface IPlatformRequest extends RequestInit {
  url: string;
}
