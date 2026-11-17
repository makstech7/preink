import type { Service } from './catalog';
import type { Block, DocKind } from './types';

// PREVIEW CONTENT ONLY.
//
// The browser receives the opening of each document and the headings of the
// rest. Withheld wording is a `greek` block: a heading and a line count, with
// no text behind it. The complete, versioned templates live on the server
// (Phase 2 and 3) and are only assembled into PDFs after payment.
//
// Wording here is draft and has not been reviewed by a lawyer. Nothing in this
// file is state-specific; state-required statements arrive through `slot`.

export interface DocContext {
  studio: string;
  services: Service[];
}

export interface DocDef {
  id: string;
  title: string;
  kind: DocKind;
  blocks: Block[];
}

const CLIENT_FIELDS: Block = {
  t: 'fields',
  rows: [
    [{ label: 'Client name', w: 3 }, { label: 'Date of birth', w: 1 }],
    [{ label: 'Phone', w: 2 }, { label: 'Email', w: 2 }],
  ],
};

export function consentForm(ctx: DocContext, service: Service): DocDef {
  return {
    id: `consent-${service.id}`,
    title: `${service.title} Procedure Consent`,
    kind: 'legal',
    blocks: [
      {
        t: 'p',
        text: `Completed before every ${service.title.toLowerCase()} procedure at ${ctx.studio}. Read each statement, ask about anything that is unclear, and initial in the box beside it.`,
      },
      CLIENT_FIELDS,
      { t: 'h', text: 'What I understand' },
      {
        t: 'initials',
        items: [
          'Permanent makeup is a form of cosmetic tattooing. Pigment is placed into the skin and cannot be washed or wiped away.',
          'Results differ from person to person. Skin type, age, sun exposure and aftercare all affect how pigment heals and how long it lasts.',
          'Color looks darker and sharper for the first days and softens as the skin heals. A follow-up visit is usually needed to finish the result.',
        ],
      },
      { t: 'greek', heading: 'Risks and possible reactions', lines: 4 },
      { t: 'greek', heading: 'My responsibilities before and after', lines: 3 },
      { t: 'slot', text: 'Statements your state requires are added here once its rules have been verified.' },
      { t: 'sign', parties: ['Client signature', 'Artist signature'] },
    ],
  };
}

export function medicalHistory(): DocDef {
  return {
    id: 'medical-history',
    title: 'Client Health History',
    kind: 'legal',
    blocks: [
      {
        t: 'p',
        text: 'Your answers help your artist decide whether today’s procedure is right for you. This form stays with the studio and is kept confidential.',
      },
      {
        t: 'fields',
        rows: [
          [{ label: 'Client name', w: 3 }, { label: 'Date of birth', w: 1 }],
          [{ label: 'Emergency contact', w: 2 }, { label: 'Their phone', w: 2 }],
        ],
      },
      { t: 'h', text: 'Check anything that applies to you' },
      {
        t: 'check',
        items: [
          'Pregnant or nursing',
          'Diabetes',
          'Taking blood-thinning medication',
          'History of keloid or raised scarring',
          'Cold sores or fever blisters',
          'Allergy to numbing creams or latex',
          'Skin condition near the treatment area',
          'Chemotherapy or radiation in the past year',
        ],
      },
      { t: 'greek', heading: 'More conditions and recent treatments', lines: 4 },
      { t: 'fields', rows: [[{ label: 'Medications and supplements you take regularly', w: 3 }]] },
      { t: 'greek', heading: 'Artist review', lines: 2 },
      { t: 'sign', parties: ['Client signature'] },
    ],
  };
}

// One visible line per service. Timings and medical specifics stay withheld
// until a working artist has reviewed them.
const PRECARE_NOTE: Record<string, string> = {
  brows: 'Do not wax, tint or thread your brows in the days before your appointment. Your artist will tell you how long to wait.',
  lips: 'If you have ever had cold sores, tell your artist when you book and ask your doctor about it before your appointment.',
  liner: 'Do not wear contact lenses or eyelash extensions to your appointment. Bring your glasses if you need them.',
};

export function precare(ctx: DocContext, service: Service): DocDef {
  return {
    id: `precare-${service.id}`,
    title: `${service.title} Pre-care`,
    kind: 'policy',
    blocks: [
      {
        t: 'p',
        text: `How to get ready for your ${service.title.toLowerCase()} appointment at ${ctx.studio}. Following these steps helps the pigment settle evenly and heal well.`,
      },
      {
        t: 'steps',
        items: [
          { label: 'When you book', text: 'Fill in your health history form honestly, including any medication you take. Your artist needs it to decide whether the procedure is right for you today.' },
          { label: 'Before you come', text: PRECARE_NOTE[service.id] ?? 'Follow any instructions your artist gives you when you book.' },
        ],
      },
      { t: 'greek', heading: 'The week before', lines: 4 },
      { t: 'greek', heading: 'The day before and the day of', lines: 4 },
      { t: 'greek', heading: 'When to reschedule', lines: 3 },
      { t: 'fields', rows: [[{ label: `${ctx.studio} phone`, w: 2 }, { label: 'Your appointment', w: 2 }]] },
    ],
  };
}

export function aftercare(ctx: DocContext, service: Service): DocDef {
  return {
    id: `aftercare-${service.id}`,
    title: `${service.title} Aftercare`,
    kind: 'policy',
    blocks: [
      {
        t: 'p',
        text: `Your ${service.area} will look darker and bolder than the healed result for about a week. That is normal, and it settles as the skin recovers.`,
      },
      {
        t: 'steps',
        items: [
          { label: 'First 24 hours', text: 'Keep the area clean and avoid touching it with unwashed hands.' },
          { label: 'Days 2 to 7', text: 'Follow the healing method your artist marked below. Never pick or scratch flaking skin; let it fall away by itself.' },
        ],
      },
      { t: 'check', items: ['Dry healing', 'Ointment healing'] },
      { t: 'greek', heading: 'Avoid for the first 10 days', lines: 5 },
      { t: 'greek', heading: 'Weeks 2 to 6', lines: 3 },
      { t: 'greek', heading: 'When to contact the studio', lines: 3 },
      { t: 'fields', rows: [[{ label: `${ctx.studio} phone`, w: 2 }, { label: 'Your follow-up visit', w: 2 }]] },
    ],
  };
}

export function photoRelease(ctx: DocContext): DocDef {
  return {
    id: 'photo-release',
    title: 'Photo and Video Release',
    kind: 'legal',
    blocks: [
      {
        t: 'p',
        text: `${ctx.studio} photographs and sometimes films procedures to document results. This form records what you agree to. Saying no to any part does not affect your appointment.`,
      },
      { t: 'h', text: 'I give permission for' },
      {
        t: 'check',
        cols: 1,
        items: [
          'Before and after photos kept in my private client record',
          'Photos or video shared on the studio’s website and social media',
          'Photos or video used in paid advertising',
          'My full face to be shown, not cropped to the treatment area',
        ],
      },
      { t: 'greek', heading: 'How long this permission lasts', lines: 3 },
      { t: 'greek', heading: 'Changing your mind', lines: 3 },
      { t: 'fields', rows: [[{ label: 'Client name', w: 3 }, { label: 'Date', w: 1 }]] },
      { t: 'sign', parties: ['Client signature'] },
    ],
  };
}

export function policies(ctx: DocContext): DocDef {
  return {
    id: 'policies',
    title: 'Studio Policies',
    kind: 'policy',
    // "Booking fee" plus a signed, dated acknowledgment follows industry guidance on
    // card disputes. It is good practice, not a guarantee, and needs lawyer review.
    blocks: [
      { t: 'p', text: `How booking works at ${ctx.studio}. Please read before you reserve a time.` },
      { t: 'h', text: 'Booking fee' },
      { t: 'p', text: 'A non-refundable booking fee of $______ reserves your appointment time. It is taken off the price of your procedure when you attend.' },
      { t: 'greek', lines: 2 },
      { t: 'h', text: 'Moving or cancelling your appointment' },
      { t: 'p', text: 'You can move your appointment once at no charge with at least ______ hours’ notice. With less notice, or after a second change, the booking fee is kept.' },
      { t: 'greek', lines: 2 },
      { t: 'h', text: 'Touch-ups' },
      { t: 'p', text: 'Your first touch-up is booked ______ weeks after your procedure, once the skin has healed.' },
      { t: 'greek', lines: 2 },
      { t: 'greek', heading: 'Late arrival', lines: 2 },
      { t: 'h', text: 'I have read and agree' },
      {
        t: 'initials',
        items: [
          'The booking fee is non-refundable and comes off the price of my procedure.',
          'I can move my appointment once with the notice above; otherwise the booking fee is kept.',
        ],
      },
      { t: 'sign', parties: ['Client signature'] },
    ],
  };
}

/** For the artist, not the client: how to apply the policies consistently. */
export function policyGuide(): DocDef {
  return {
    id: 'policy-guide',
    title: 'Using Your Policies',
    kind: 'business',
    blocks: [
      {
        t: 'p',
        text: 'Policies only help if clients see them before they pay and you apply them the same way every time. These habits make that easier. They are good practice, not a guarantee of how any dispute ends.',
      },
      {
        t: 'steps',
        items: [
          { label: 'Before they pay', text: 'Show the policy where clients book, and link to it in your booking confirmation. Call it a booking fee, not a deposit.' },
          { label: 'In writing', text: 'Have the client initial and sign the policy page, or tick a dated box when booking online. Keep it with their client record.' },
          { label: 'Every time', text: 'Apply the same rules to friends, models and regulars. Exceptions are hard to explain later.' },
        ],
      },
      { t: 'greek', heading: 'Reminder messages', lines: 4 },
      { t: 'greek', heading: 'When a client asks for the fee back', lines: 4 },
      { t: 'greek', heading: 'If a client disputes the charge with their bank', lines: 4 },
    ],
  };
}

const MENU: Record<string, { name: string; note?: string; price: string }[]> = {
  brows: [
    { name: 'Microblading', note: 'hair-stroke brows', price: '$450' },
    { name: 'Powder brows', note: 'soft shaded finish', price: '$500' },
    { name: 'Combination brows', price: '$550' },
  ],
  lips: [
    { name: 'Lip blush', note: 'sheer tint of color', price: '$500' },
    { name: 'Full lip color', price: '$600' },
  ],
  liner: [
    { name: 'Lash line enhancement', note: 'no visible line', price: '$300' },
    { name: 'Classic eyeliner', note: 'upper lid', price: '$400' },
  ],
};

export function priceMenu(ctx: DocContext): DocDef {
  return {
    id: 'price-menu',
    title: 'Price Menu',
    kind: 'business',
    blocks: [
      ...ctx.services.map(
        (s): Block => ({ t: 'menu', groups: [{ name: s.label, items: MENU[s.id] ?? [] }] }),
      ),
      {
        t: 'menu',
        groups: [
          {
            name: 'After your first visit',
            items: [
              { name: 'Follow-up touch-up', note: 'within 8 weeks', price: '$100' },
              { name: 'Color refresh', note: 'after 12 months', price: '$250' },
            ],
          },
        ],
      },
      { t: 'note', text: 'Example prices. Yours go in when you build the final kit.' },
    ],
  };
}

export function pricingCalculator(): DocDef {
  return {
    id: 'pricing-calculator',
    title: 'Pricing Calculator',
    kind: 'business',
    blocks: [
      { t: 'p', text: 'Work out what one appointment really costs you before you choose a price. Fill in your own numbers.' },
      { t: 'h', text: 'What each client costs you' },
      {
        t: 'ledger',
        items: [
          { label: 'Pigment, needles and disposables per client', unit: '$' },
          { label: 'Your time, including setup and cleanup', unit: 'hrs' },
          { label: 'Room rent or booth fee each month', unit: '$' },
          { label: 'Appointments you expect each month', unit: 'no.' },
        ],
      },
      { t: 'greek', heading: 'Your break-even price', lines: 4 },
      { t: 'greek', heading: 'A sensible starting price', lines: 4 },
      { t: 'greek', heading: 'When to raise it', lines: 3 },
    ],
  };
}

export function modelCallScript(ctx: DocContext): DocDef {
  const names = ctx.services.map((s) => s.label.toLowerCase());
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? 'permanent makeup');
  return {
    id: 'model-call',
    title: 'Model Call Script',
    kind: 'business',
    blocks: [
      { t: 'p', text: 'Post this when you are ready for your first models. Change the words until it sounds like you.' },
      { t: 'h', text: 'The post' },
      {
        t: 'quote',
        text: `I’m a newly certified permanent makeup artist at ${ctx.studio} and I’m building my portfolio. I have a small number of model appointments for ${list} at a reduced rate this month.`,
      },
      { t: 'greek', lines: 4 },
      { t: 'greek', heading: 'Replying to people who message you', lines: 4 },
      { t: 'greek', heading: 'Who to turn away, kindly', lines: 3 },
    ],
  };
}

export function firstTenClients(): DocDef {
  return {
    id: 'first-ten-clients',
    title: 'Your First Ten Clients',
    kind: 'business',
    blocks: [
      { t: 'p', text: 'A four-week plan that does not depend on going viral or paying for ads.' },
      {
        t: 'steps',
        items: [
          { label: 'Week 1', text: 'Tell the people who already know you. Message twenty friends, relatives and coworkers one at a time, not in a group post.' },
          { label: 'Week 2', text: 'Book three models. Photograph every stage in the same light, against the same wall, so your results are easy to compare.' },
        ],
      },
      { t: 'greek', heading: 'Week 3', lines: 4 },
      { t: 'greek', heading: 'Week 4', lines: 4 },
      { t: 'greek', heading: 'What to track', lines: 3 },
    ],
  };
}

export function launchChecklist(): DocDef {
  return {
    id: 'launch-checklist',
    title: 'Launch Checklist',
    kind: 'business',
    blocks: [
      { t: 'p', text: 'Everything to have in place before your first paying client walks in.' },
      { t: 'h', text: 'Before you open' },
      {
        t: 'check',
        cols: 1,
        items: [
          'Training certificate framed and on display',
          'License or registration confirmed with your state or local health department',
          'Liability insurance in place',
          'Consent, health history and aftercare forms printed',
          'Booking link tested from a phone',
          'Deposit and cancellation policy shown where clients book',
          'Price menu printed and saved as an image on your phone',
        ],
      },
      { t: 'greek', heading: 'Your first week', lines: 4 },
      { t: 'greek', heading: 'Your first month', lines: 3 },
    ],
  };
}
