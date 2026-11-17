import { EDITION, serviceById } from './catalog';
import * as docs from './documents';
import { placeName } from './jurisdictions';
import type { KitInput, KitPage } from './types';

export const PLACEHOLDER_STUDIO = 'Your Studio Name';

/** The ordered list of pages for one artist's kit. Pure: same input, same kit. */
export function assembleKit(input: KitInput): KitPage[] {
  const ctx: docs.DocContext = {
    studio: input.studio || PLACEHOLDER_STUDIO,
    services: input.services.map(serviceById),
  };

  const body: KitPage[] = [
    ...ctx.services.map((s) => docs.consentForm(ctx, s)),
    docs.medicalHistory(),
    ...ctx.services.map((s) => docs.aftercare(ctx, s)),
    docs.photoRelease(ctx),
    docs.policies(ctx),
    docs.priceMenu(ctx),
    docs.pricingCalculator(),
    docs.modelCallScript(ctx),
    docs.firstTenClients(),
    docs.launchChecklist(),
  ];

  const where = placeName(input.country, input.state);
  const summary = [ctx.services.map((s) => s.label).join(' · '), where].filter(Boolean).join('  /  ');

  const cover: KitPage = {
    id: 'cover',
    title: 'Studio Launch Kit',
    kind: 'cover',
    blocks: [{ t: 'cover', contents: body.map((p) => p.title), summary: summary || EDITION.name }],
  };

  return [cover, ...body];
}
