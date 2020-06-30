import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { cloneDeep } from 'lodash';
import TsxComponent, { createProps } from 'components/tsx-component';
import { formMetadata, metadata } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import BroadcastInput from './BroadcastInput';
import {
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
  YoutubeService,
} from 'services/platforms/youtube';
import CommonPlatformFields from '../CommonPlatformFields';
import { StreamingService } from '../../../app-services';
import { SyncWithValue } from '../../../services/app/app-decorators';
import { IStreamSettings } from '../../../services/streaming';
import BaseEditStreamInfo from '../BaseEditSteamInfo';

class Props {
  value?: IStreamSettings;
}

@Component({ components: { ValidatedForm }, props: createProps(Props) })
export default class YoutubeEditStreamInfo extends BaseEditStreamInfo<Props> {
  @Inject() private youtubeService: YoutubeService;
  @Inject() private streamingService: StreamingService;
  @SyncWithValue() protected settings: IStreamSettings = null;
  broadcasts: IYoutubeLiveBroadcast[] = [];
  broadcastsLoaded = false;

  async created() {
    this.broadcasts = await this.youtubeService.fetchBroadcasts();
    this.broadcastsLoaded = true;
  }

  get canChangeBroadcast() {
    return !this.view.isMidStreamMode;
  }

  get view() {
    return this.streamingService.views;
  }

  onSelectBroadcastHandler() {
    // set title and description fields from selected broadcast
    const ytSettings = this.settings.destinations.youtube;
    const selectedBroadcast = this.broadcasts.find(
      broadcast => broadcast.id === ytSettings.broadcastId,
    );
    if (!selectedBroadcast) return;
    const { title, description } = selectedBroadcast.snippet;
    ytSettings.title = title;
    ytSettings.description = description;
  }

  get formMetadata() {
    return formMetadata({
      title: metadata.text({
        title: $t('Title'),
        fullWidth: true,
        required: true,
      }),
      description: metadata.textArea({
        title: $t('Description'),
        fullWidth: true,
      }),
      event: {
        broadcasts: this.broadcasts,
        loading: !this.broadcastsLoaded,
        disabled: !this.canChangeBroadcast,
      },
    });
  }

  emitInput() {
    this.$emit('input', this.settings);
  }

  render() {
    const canShowOnlyRequiredFields = this.canShowOnlyRequiredFields;
    return (
      !canShowOnlyRequiredFields && (
        <ValidatedForm onInput={this.emitInput}>
          <HFormGroup title={$t('Event')}>
            <BroadcastInput
              onInput={this.onSelectBroadcastHandler}
              vModel={this.settings.destinations.youtube.broadcastId}
              metadata={this.formMetadata.event}
            />
          </HFormGroup>
          <CommonPlatformFields vModel={this.settings} platform={'youtube'} />
        </ValidatedForm>
      )
    );
  }
}
