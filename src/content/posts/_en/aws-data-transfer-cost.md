---
pubDatetime: 2026-08-28T18:00:00+09:00
title: "AWS Data Transfer Costs: Read the Boundaries, Not the Rate Table"
lang: en
translationKey: aws-data-transfer-cost
featured: false
draft: false
tags:
  - AWS
  - Cloud
  - Network
  - Pricing
description: "Revisiting a 2021 write-up of AWS data transfer pricing against today's rates. The numbers have changed several times over; the structure hasn't. Which boundaries cost money, and which parts of the original are now wrong."
---

I was working on a game project and looking at putting the database on AWS,
moving data back and forth. Instance pricing you can read straight off a
table, but I had no feel for what the moving-data-around part would actually
cost. Looking into it, I ended up clipping a
[write-up](https://ltlkodae.tistory.com/27) of AWS data transfer costs. It was
written in December 2021 and tabulates, for EC2 in the Seoul region, that
inbound is free and outbound is priced by destination.

Reading it again, the post's shelf life splits into two layers. **The numbers
have changed several times over** — some of them had already changed by the
time the post went up. The **structure**, though — where the boundaries are
and that crossing one starts a meter — is intact.

So this post doesn't reproduce a rate table. Rates differ by region and keep
moving, so they're a value to look up on the [official pricing
page](https://aws.amazon.com/ec2/pricing/on-demand/) each time. What it does
instead is lay out where the boundaries are drawn, and where the original
needs correcting today.

## Table of contents

## The structure the original laid out

The skeleton of the original:

1. Inbound (data coming in) is free
2. Outbound is priced by destination
   - Going out to the internet is the most expensive
   - Going to another region is next
   - Within the same region: same AZ is free, a different AZ is charged
   - Sending directly to a regional service's endpoint is free

The Korean title — roughly "you came in as you pleased, but you don't leave
that way" — sums the structure up in one line. It's a statement that cloud
pricing is designed to **hold data in**, and that property is still true four
years on.

## What changed in four years

### 100 GB a month became free

This one had already landed days before the original was published.

> Data Transfer from AWS Regions to the Internet is now free for up to 100 GB
> of data per month (up from 1 GB per region).

> Data Transfer from Amazon CloudFront is now free for up to 1 TB of data per
> month (up from 50 GB).

> This change is effective December 1, 2021 and takes effect with no effort on
> your part.

The original is dated 12 December 2021, so **the change was already in effect
when the post went up**. The post doesn't mention it. A good example of why a
publication date alone doesn't make a source current.

The EC2 pricing page's current wording:

> AWS customers receive 100 GB of free data transfer out to the internet free
> each month, aggregated across all AWS Services and Regions (except China and
> GovCloud).

The part that matters is **"aggregated across all AWS Services and Regions"** —
not 100 GB per service or per region, but 100 GB per month across the whole
account. For a personal project or a small service, that allowance often
covers everything. At scale it becomes a rounding error.

### Leaving AWS is free

An item added in 2024. If the purpose is migrating off AWS, the internet
outbound charges are waived.

> waiving data transfer out to the internet (DTO) charges when you want to
> move outside of AWS

Conditions attach. You request credits through AWS Support, and once approved
you have 90 days to complete the move. Review happens at the account level,
with additional scrutiny if the same account applies repeatedly. The
announcement states that this follows the direction set by the **European Data
Act**.

So "you don't leave as you please" has one exception now. It applies to
**leaving entirely**, though — it isn't something you can use to keep traffic
permanently spread across multiple clouds.

### Public IPv4 addresses became billable

Not in the original, and a line item separate from data transfer that's new on
the bill.

> $0.005 per IP per hour for all public IPv4 addresses, whether attached to a
> service or not

In effect since 1 February 2024. Previously only **idle** Elastic IPs were
charged; now **every public IPv4, including the ones in use**, is in scope. The
EC2 free tier includes 750 hours a month for the first 12 months.

At $0.005 per hour each, that's roughly $3.60 a month. One is negligible, but
with dev, staging and production environments each carrying NAT gateways and
load balancers, the count climbs quickly.

## Read the boundaries, not the rate table

Knowing **which line starts a meter** lasts longer than memorising numbers.
From the inside out:

| Boundary | Nature |
| --- | --- |
| Inbound (internet → AWS) | Free |
| Within the same AZ | Free |
| Same region, different AZ | Charged |
| Different region | Charged (more) |
| Outbound to the internet | Most expensive |

The easy mistake here is the **AZ boundary**. The AWS pricing page marks this
item "in each direction" — it applies on both the sending and the receiving
side, so round-trip traffic costs twice the unit rate. Configure multi-AZ for
availability and that traffic flows constantly by design. A good chunk of what
gets called "the cost of availability" comes from here.

## What needs correcting in the original

The original describes VPC endpoints like this:

> 다만 VPC endpoint 사용 비용이 추가로 발생하므로 사실상 무료는 아니다.
> (역시나 공짜는 없다)
>
> (However, using a VPC endpoint incurs an additional cost, so it isn't really
> free. As always, there's no such thing as free.)

**That sentence doesn't hold for the example the original gives (EC2 → S3),**
because there are two kinds of VPC endpoint and their pricing structures are
completely different.

- **Gateway endpoints** — for S3 and DynamoDB only. No hourly charge and no
  data processing charge.
- **Interface endpoints (AWS PrivateLink)** — for everything else. Charged per
  hour per AZ, plus per GB of data processed.

The AWS VPC pricing page is categorical:

> There are no data processing or hourly charges for using Gateway Type VPC
> endpoints.

([Amazon VPC Pricing](https://aws.amazon.com/vpc/pricing/))

The original's example is storing data from EC2 into S3, and what fits that is
a gateway endpoint. So **in exactly that example it really is free.** The
"additional cost" the original refers to belongs to interface endpoints; the
sentence reads like the two kinds weren't separated.

### So what was actually costing money?

Where the original says "without an endpoint the data goes EC2 → internet →
S3, so you're charged," the direction is right. But the meter that's actually
running is often not data transfer — it's the **NAT gateway**. The AWS VPC
pricing page uses this very example:

> To avoid the NAT Gateway Data Processing charge in this example, you could
> set up a gateway Type VPC endpoint and route the traffic to/from S3 through
> the VPC endpoint instead of going through the NAT Gateway.

A NAT gateway carries a **per-GB data processing charge** on everything passing
through it, on top of its hourly rate. The pricing page's example figures are
$0.045 per hour and $0.045 per GB (region-dependent, so check the pricing page
for the real value). If an instance in a private subnet is continuously
writing to S3, all of that traffic goes through the NAT gateway and is billed
per GB.

Put another way, adding a gateway endpoint isn't "trading free for some other
cost" — it's **removing the NAT gateway processing charge**. The architecture
docs describe it the same way.

> VPC gateway endpoints allow communication to Amazon S3 and Amazon DynamoDB
> without incurring data transfer charges within the same Region.

## Where the money actually leaks

Once you know the boundaries, the leaks are roughly predictable. In rough
order of how often they come up:

- **NAT gateway** — everything leaving a private subnet passes through a
  per-GB charge. Moving S3 and DynamoDB onto gateway endpoints cuts that much
  out.
- **Cross-AZ traffic** — with the application server and the database in
  different AZs, every query response crosses a paid segment. Being charged in
  both directions, it adds up faster than it feels like it should.
- **Internet outbound** — everything you send to users. Past the 100 GB a
  month, it grows linearly.
- **Logs and backups** — replicate to another region and cross-region transfer
  charges become continuous. The hidden fixed cost of a disaster recovery
  setup.
- **Public IPv4** — billed by count × time, regardless of traffic volume.

## From a client developer's side

There are places this structure matters even if you don't run the servers.

Everything a game client downloads is **internet outbound**. Asset bundles,
patch files, images, replay data — all of it. Which means work on the client
to shrink download size affects the bill directly, not just load times.
Changing a texture compression format, or splitting bundles so only what's
needed gets fetched, connects to a line on the infrastructure invoice.

The same goes for the case from the previous post, where the client can't call
an external API directly and you put a backend proxy in front. The size of the
response the proxy returns *is* the outbound volume. Whether you pass the
upstream response through as-is or trim it to the fields you need stops being
a matter of taste and becomes a cost decision.

Put the database in the cloud and one more axis appears. Traffic the server
reads from the database is free within the same AZ but charged in both
directions once the AZs differ. And the leg that carries the result down to
the client is internet outbound. Worth internalising early: **the main axis of
the bill is not how much you read from the database, it's how much you send to
the client.** Write an API that ships whole query results down the wire and
that design shows up on the invoice every month.

## Summary

- The original's structure — inbound free, outbound priced by destination — is
  still valid. The numbers are not.
- 100 GB of internet outbound a month is free, **aggregated across the whole
  account**, not per service or region. That change took effect on 1 December
  2021, before the original was published.
- If you're leaving AWS entirely, outbound charges can be waived (by request,
  90-day limit). It follows the direction of the European Data Act.
- Since February 2024, public IPv4 addresses are billed at $0.005 per hour
  each, in use or not.
- Gateway endpoints (S3, DynamoDB) have no hourly and no data processing
  charge. The original's "not really free" applies to interface endpoints.
- What an endpoint actually removes is usually not a data transfer charge but
  the NAT gateway's data processing charge.
- Cross-AZ traffic is charged in both directions. That's where the standing
  cost of a multi-AZ setup comes from.

## References

- [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/)
- [Amazon VPC Pricing](https://aws.amazon.com/vpc/pricing/)
- [AWS Free Tier Data Transfer Expansion — AWS News Blog](https://aws.amazon.com/blogs/aws/aws-free-tier-data-transfer-expansion-100-gb-from-regions-and-1-tb-from-amazon-cloudfront-per-month/)
- [Free Data Transfer Out to Internet When Moving Out of AWS — AWS News Blog](https://aws.amazon.com/blogs/aws/free-data-transfer-out-to-internet-when-moving-out-of-aws/)
- [New AWS Public IPv4 Address Charge — AWS News Blog](https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights/)
- [Overview of Data Transfer Costs for Common Architectures — AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/)
- Original post (Korean): [AWS 데이터 전송비용 정리](https://ltlkodae.tistory.com/27)
