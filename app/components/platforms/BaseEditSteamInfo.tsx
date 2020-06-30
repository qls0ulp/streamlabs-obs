import TsxComponent from 'components/tsx-component';
import { TPlatform } from '../../services/platforms';
import { IStreamSettings } from '../../services/streaming';

export default abstract class BaseEditStreamInfo<Props> extends TsxComponent<Props> {
  protected abstract settings: IStreamSettings;

  get enabledPlatforms(): TPlatform[] {
    const platforms = Object.keys(this.settings.destinations) as TPlatform[];
    return platforms.filter(platform => this.settings.destinations[platform].enabled);
  }

  get canShowOnlyRequiredFields(): boolean {
    return this.enabledPlatforms.length > 1 && !this.settings.advancedMode;
  }
}
