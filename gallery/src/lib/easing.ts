import type {EffectMeta} from '../../../meta/schema';
/** Molten Metal reads the composition frame directly, not the progress prop. */
export const supportsEasing=(meta:EffectMeta)=>meta.slug!=='molten-metal'&&(meta.sharedProps||Boolean(meta.props.progress));
