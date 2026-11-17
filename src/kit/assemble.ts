import { EDITION, serviceById, tierIncludes } from './catalog';
import * as docs from './documents';
import { placeName } from './jurisdictions';
import type { KitInput, KitPage, TierId } from './types';

export const PLACEHOLDER_STUDIO = 'Your Studio Name';

/** The ordered list of pages for one artist's kit. Pure: same input, same kit. */
export function assembleKit(input: KitInput): KitPage[] {
  const ctx: docs.DocContext = {
    studio: input.studio || PLACEHOLDER_STUDIO,
    services: input.services.map(serviceById),
  };

  // Client safety forms are in every tier; no buyer should be without them.
  const byTier: [TierId, KitPage[]][] = [
    ['essentials', [
      ...ctx.services.map((s) => docs.consentForm(ctx, s)),
      docs.medicalHistory(),
      ...ctx.services.map((s) => docs.precare(ctx, s)),
      ...ctx.services.map((s) => docs.aftercare(ctx, s)),
      docs.photoRelease(ctx),
    ]],
    ['studio', [docs.policies(ctx), docs.policyGuide(), docs.priceMenu(ctx), docs.pricingCalculator()]],
    ['launch', [docs.modelCallScript(ctx), docs.firstTenClients(), docs.launchChecklist()]],
  ];
  const body = byTier.filter(([from]) => tierIncludes(input.tier, from)).flatMap(([, pages]) => pages);

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
