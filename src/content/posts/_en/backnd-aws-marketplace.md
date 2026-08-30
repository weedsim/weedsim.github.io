---
pubDatetime: 2026-08-30T17:00:00+09:00
title: "Subscribing to BACKND via AWS Marketplace: Start With Why the Warnings Are There"
lang: en
translationKey: backnd-aws-marketplace
featured: false
draft: false
tags:
  - BACKND
  - AWS
  - BaaS
  - Game Server
  - Pricing
description: "The steps for subscribing to BACKND through AWS Marketplace, and why the two warnings in the announcement exist — explained through the AWS SaaS onboarding flow. Plus what cancellation actually suspends and where the real price list lives."
---

In the previous post I worked through transfer costs for putting a game
project's database on AWS. I'd been looking at the other side of that choice
too: renting a game backend as a service instead of standing up servers. That's
how I ended up clipping the
[announcement that BACKND is now on AWS Marketplace](https://blog.thebackend.io/awsmarketplaceguide/).

The content itself is a subscription walkthrough. What caught my eye were the
two warnings dropped in the middle of it: **"if you register directly in the
BACKND console, it won't be linked to your AWS account"** and **"if the
authentication token expires during signup, you have to cancel the subscription
and start over."** Following the steps is easy enough, but without knowing why
those constraints exist, you have no idea what to do when you actually get
stuck. So I started from that structure.

## Table of contents

## What BACKND is

BACKND (뒤끝) is a BaaS that provides a game backend as a service. It's operated
by **AFI, Inc.**, based in Seoul, and supports Unity and Unreal.

The AWS Marketplace listing describes it as:

> a cloud-based backend service that enables game developers to integrate
> essential server features

The feature set covers what game backends need over and over: social login
authentication, game data storage, leaderboards, friends and guilds, mail,
coupons, push notifications, receipt validation, matchmaking (BACKND Match) and
serverless functions (BACKND Function). The layer you end up rebuilding every
time you write servers yourself.

Pricing is usage-based with no fixed monthly fee. BACKND's own pricing page
lists three tiers — FREE, Basic and Enterprise — and the FREE band is fairly
generous. Monthly free call allowances are set per feature (50,000 calls a
month for most Base features, 1 million push notifications, 1 million database
reads and writes each plus 5 GB of storage, and so on), with per-feature rates
applying beyond that.

## What subscribing through the Marketplace changes

The first thing to note is that **the product doesn't change**. The Marketplace
is a distribution and payment channel, not a different service. What changes is
the path the money takes.

AWS's stated buyer benefit reads:

> Find, try, buy, and launch SaaS applications fast, while consolidating
> billing on AWS.

So instead of registering a payment method with BACKND, it **folds into a
single AWS invoice**. If you're already on AWS that's one fewer billing
relationship, and depending on the organisation it can be tied to existing AWS
agreements or committed spend. For a solo developer the difference is small,
but for a team with a purchase approval process it genuinely lowers the barrier
to adoption.

The pricing axis visible on the Marketplace listing is a single dimension —
**"BACKND Total Usage (Server API Usage)" at $0.01 per unit**. BACKND's own
price list, by contrast, is broken down far more finely ($0.000018 per call for
operation management, $0.000027 for user management, $0.000036 for
leaderboards, $0.015364 per GB per day for database storage, and so on).

The orders of magnitude differ, so the Marketplace "unit" is best read as **a
billing denomination rather than an individual API call.** Which means if you
want the actual rates, you look at BACKND's pricing page, not the Marketplace
page. Estimating cost from the Marketplace figure alone will be wrong.

> Worth checking: neither set of documents states whether the FREE band still
> applies to an account created through the Marketplace. If you're planning to
> start inside the free allowance, it's safer to confirm before subscribing.

## The subscription steps

Per the announcement, the flow is five steps.

1. On BACKND's AWS Marketplace page, review the service details, pricing and
   support information.
2. Click **View purchase options** at the top right of the detail page to reach
   the subscription page.
3. Review the pricing and click **Subscribe** at the bottom.
4. Once the subscription completes, click **Set up your account** at the top of
   the page. You're taken to BACKND's registration page, where you sign up with
   an email and password.
5. Account linking happens automatically and you can start using it right away.

Step 4 is the whole thing. And that single step carries both warnings.

## Why the warnings are there

Both come out of how AWS Marketplace's SaaS onboarding is designed. The AWS
seller documentation describes the flow.

When the subscription completes, AWS generates a token identifying the buyer.

> A registration token is generated for the customer that contains their AWS
> account ID, customer identifier, and your product code.

And when you press **Set up your account**, the browser POSTs that token to the
seller's registration page.

> The customer's browser sends a `POST` request to your software's
> registration landing page URL. The request contains one `POST` parameter,
> `x-amzn-marketplace-token`, containing the customer's registration token.

The seller then exchanges that token with AWS for an actual customer
identifier.

> To redeem this registration token for a customer AWS account ID, customer
> identifier, and product code, your website must call ResolveCustomer on the
> AWS Marketplace Metering Service.

That accounts for both warnings.

### "Registering directly in the console won't link it"

The information connecting an AWS account to a BACKND account exists **only in
that token.** Sign up on BACKND's own site and there is no POST carrying the
token at all, so from BACKND's side there's no way to know which AWS
subscription this person corresponds to. Linking doesn't "fail" — there's
nothing to link with.

The key point is that `Set up your account` is not a plain link but **a form
submission carrying a token**. Skip that button and the rest of the procedure
can be perfect and still not connect.

### "If the token expires you have to subscribe again"

The token has a lifetime. The AWS documentation puts it this way:

> The registration token resolves to a specific subscribed customer and each
> generated token has an expiration window of 4 hours.

And the same document immediately adds:

> We recommend that you resolve the registration token immediately because it
> may expire after approximately one hour.

So four hours is the ceiling, but in practice the guidance is **resolve it
within the hour**. Subscribe, leave the signup screen open, go do something
else and come back, and you can pass that window. Once the token expires you
need a new one — and since tokens are generated at subscription time, the
instruction lands on **cancel and resubscribe**.

In practice this is simple. **Decide the email and password you'll sign up with
before pressing Subscribe, and run straight through to step 4 in one sitting.**
Just not stepping away mid-flow avoids the problem entirely.

## What cancellation suspends

This is the part to be most careful about before adopting. The announcement's
wording:

> 회원님의 뒤끝 계정과 모든 프로젝트가 정지됩니다.
>
> (Your BACKND account and all of your projects will be suspended.)

Meaning one subscription hangs over the entire account. It's account-scoped,
not project-scoped, so tidying up the Marketplace subscription stops every
project created under that account. Which is why the announcement tells you to
back up before cancelling.

It isn't a total loss. Per the announcement you can recover by converting to a
**standard BACKND account** (one registered directly on BACKND's own site
rather than through the Marketplace), with conversion enquiries going to
`help@backnd.com`. There's a condition attached, though.

> 복구 시에는 해지 기간 동안 발생한 소량의 데이터 저장 비용이 청구될 수 있습니다.
>
> (On recovery, a small data storage charge accrued during the suspension may
> be billed.)

In short, moving between a Marketplace account and a standard account is **a
manual process**. Not a toggle you flip yourself, but something you file a
request for. The price of consolidating billing into AWS is that changing which
side the account belongs to gets that much stickier.

## Build it or rent it

As covered in the previous post, putting a database on AWS yourself adds NAT
gateway, cross-AZ traffic and internet outbound as separate line items on top
of the instance cost. Those items accrue **from the configuration alone**,
independent of your game logic.

A BaaS absorbs those items into one charge. It's usage-based with a free band,
so the up-front cost is close to zero — but the unit rates are the vendor's,
and you can't change them later.

- **Build it yourself** — lower unit rates and full control. In exchange, every
  piece of the configuration carries a charge, and somebody has to manage it.
- **BaaS** — low up-front cost and low operational burden. In exchange, the
  unit-rate gap compounds as you scale, and moving means lifting out both data
  and code.

The Marketplace subscription layers one more thing on top. **On top of being
tied to BACKND, the account is tied to one specific AWS account's
subscription.** If you ever restructure your AWS accounts or move to an
organisation account, that link has to be dealt with too.

## Check before subscribing

- **Sign up only through the Set up your account button.** Don't register on
  BACKND's site first.
- **Do the subscription and the signup in one sitting.** The token lives about
  an hour.
- **Decide whose name the account is in first.** Subscribe under a personal AWS
  account and moving it to a team or company account later becomes a support
  request.
- **Confirm whether the FREE band still applies.** The documentation doesn't
  say.
- **Cancellation stops the whole account**, not a single project. Back up
  first.
- **The original announcement hasn't been updated since August 2025.**
  Marketplace screens and button names can change, so go by what's actually on
  screen.

## Summary

- BACKND is a game BaaS operated by AFI, Inc. It supports Unity and Unreal,
  prices by usage, and has a FREE band.
- A Marketplace subscription doesn't change the product. It consolidates
  billing onto the AWS invoice.
- The "registering directly won't link it" warning exists because the only
  thing tying an AWS account to a BACKND account is the registration token that
  the `Set up your account` button POSTs.
- The "token expiry" warning exists because that token lasts at most four
  hours, with an hour recommended. Run subscription and signup back to back and
  you'll never meet it.
- Cancellation suspends **the whole account**, not a project. You can recover by
  converting to a standard account, but it's a manual, support-mediated process
  and storage charges from the suspension may be billed.
- Estimate cost from BACKND's pricing page, not the Marketplace listing's
  single dimension.

## References

- [Onboarding customers to your SaaS product through AWS Marketplace — AWS Marketplace](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-product-customer-setup.html)
- [Software as a Service (SaaS) in AWS Marketplace](https://aws.amazon.com/marketplace/features/software-as-a-service-saas)
- [AWS Marketplace: BACKND](https://aws.amazon.com/marketplace/pp/prodview-ggswe3jeapilc)
- [BACKND](https://backnd.com/en/) / [BACKND SDK docs](https://developer.thebackend.io/unity3d/main/)
- Original post (Korean): [AWS 마켓플레이스를 통해 뒤끝을 구독하는 방법](https://blog.thebackend.io/awsmarketplaceguide/)
