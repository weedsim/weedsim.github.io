---
pubDatetime: 2026-08-28T18:00:00+09:00
title: "AWS 데이터 전송 비용: 요금표가 아니라 경계선을 봐야 한다"
lang: ko
translationKey: aws-data-transfer-cost
featured: false
draft: false
tags:
  - AWS
  - 클라우드
  - 네트워크
  - 요금
description: "2021년에 정리된 AWS 데이터 전송 요금 글을 지금 기준으로 다시 봤다. 숫자는 이미 여러 번 바뀌었지만 구조는 그대로다. 무엇이 경계선이고, 원문의 어느 부분이 지금은 틀렸는지 정리했다."
---

게임 프로젝트를 진행하면서 DB를 AWS에 두고 데이터를 주고받는 구성을
검토하던 중이었다. 인스턴스 요금은 표만 보면 바로 나오는데, 정작 데이터를
오가게 하는 쪽에서 얼마가 나올지는 감이 잡히지 않았다. 그래서 찾아보다가 AWS
데이터 전송 비용을 정리한 [글](https://ltlkodae.tistory.com/27)을
스크랩해뒀었다. 2021년 12월에 쓰인 글이고, 서울 리전 EC2 기준으로 인바운드는
무료, 아웃바운드는 목적지에 따라 가격이 갈린다는 걸 표로 정리한 내용이다.

다시 읽어보니 이 글의 유효기간이 두 층으로 나뉜다. **숫자는 이미 여러 번
바뀌었고**, 심지어 이 글이 올라온 시점에 이미 바뀌어 있던 것도 있다. 반면
**구조 — 어디가 경계선이고 그 선을 넘을 때 돈이 붙는다는 틀 — 은 그대로다.**

그래서 이 글은 요금표를 옮겨 적지 않는다. 요금은 리전마다 다르고 계속
바뀌므로 [공식 요금
페이지](https://aws.amazon.com/ec2/pricing/on-demand/)에서 그때그때 봐야 하는
값이다. 대신 경계선이 어디에 그어져 있는지, 그리고 원문에서 지금 기준으로
고쳐야 할 곳이 어디인지를 정리한다.

## 목차

## 원문이 정리한 구조

원문의 뼈대는 이렇다.

1. 인바운드(들어오는 데이터)는 무료
2. 아웃바운드는 목적지에 따라 비용이 결정
   - 인터넷으로 나가는 게 가장 비싸다
   - 다른 리전으로 가는 건 그다음
   - 같은 리전 안에서는 같은 AZ면 무료, 다른 AZ면 과금
   - 리전 서비스의 엔드포인트로 직접 보내면 무료

제목의 "들어올 때는 마음대로 왔지만, 나갈 때는 아니란다"가 이 구조를 한 줄로
요약한다. 클라우드 요금이 데이터를 **가두는 방향**으로 설계되어 있다는 이야기고,
이 성질은 4년이 지난 지금도 유효하다.

## 4년 사이에 바뀐 것

### 매월 100GB는 무료가 되었다

원문이 올라오기 며칠 전에 이미 적용된 변경이다.

> Data Transfer from AWS Regions to the Internet is now free for up to 100 GB
> of data per month (up from 1 GB per region).

> Data Transfer from Amazon CloudFront is now free for up to 1 TB of data per
> month (up from 50 GB).

> This change is effective December 1, 2021 and takes effect with no effort on
> your part.

원문의 게시일이 2021년 12월 12일이니, **글이 올라온 시점에 이미 이 변경이
적용된 상태**였다. 원문에는 이 내용이 없다. 자료를 볼 때 게시일만 보고
"최신"이라고 판단하면 안 되는 이유의 좋은 예다.

현재 EC2 요금 페이지의 표현은 이렇다.

> AWS customers receive 100 GB of free data transfer out to the internet free
> each month, aggregated across all AWS Services and Regions (except China and
> GovCloud).

중요한 건 **"aggregated across all AWS Services and Regions"** 부분이다.
서비스별·리전별로 100GB씩이 아니라, 계정 전체에서 합산해 월 100GB다.
개인 프로젝트나 소규모 서비스라면 이 한도 안에서 끝나는 경우가 많다.
반대로 규모가 커지면 이 무료 한도는 반올림 오차가 된다.

### AWS를 떠날 때는 무료다

2024년에 생긴 항목이다. AWS 밖으로 이전할 목적이라면 인터넷 아웃바운드
요금을 면제해준다.

> waiving data transfer out to the internet (DTO) charges when you want to
> move outside of AWS

조건이 붙는다. AWS Support에 크레딧을 신청해야 하고, 승인되면 90일 안에
이전을 마쳐야 한다. 계정 단위로 심사하며, 같은 계정이 반복 신청하면 추가
심사가 붙는다. 발표문은 이 조치가 **유럽 데이터법(European Data Act)이 정한
방향을 따른 것**이라고 밝히고 있다.

즉 "나갈 때는 마음대로 못 나간다"에 예외가 하나 생겼다. 다만 **완전히 떠나는
경우**에 한한 것이지, 멀티 클라우드로 트래픽을 상시 분산하는 용도로 쓸 수 있는
게 아니다.

### 퍼블릭 IPv4 주소가 과금 대상이 되었다

원문에 없는, 그리고 데이터 전송과 별개로 청구서에 새로 생긴 줄이다.

> $0.005 per IP per hour for all public IPv4 addresses, whether attached to a
> service or not

2024년 2월 1일부터 적용됐다. 이전에는 **놀고 있는** Elastic IP만 과금됐는데,
지금은 **쓰고 있는 것도 포함해 모든 퍼블릭 IPv4**가 대상이다. EC2 프리 티어에는
첫 12개월간 월 750시간이 포함된다.

한 개당 시간 0.005달러면 한 달에 약 3.6달러다. 하나면 무시할 만하지만,
개발·스테이징·운영 환경에 NAT 게이트웨이와 로드밸런서까지 붙어 있는 구성이면
개수가 금방 늘어난다.

## 요금표 대신 경계선으로 보기

숫자를 외우는 것보다 **어느 선을 넘을 때 계량기가 도는지**를 아는 게 오래
간다. 안쪽에서 바깥쪽 순서로 보면 이렇다.

| 경계 | 성격 |
| --- | --- |
| 인바운드(인터넷 → AWS) | 무료 |
| 같은 AZ 안 | 무료 |
| 같은 리전, 다른 AZ | 과금 |
| 다른 리전 | 과금 (더 비쌈) |
| 인터넷으로 아웃바운드 | 가장 비쌈 |

여기서 실수하기 쉬운 게 **AZ 경계**다. AWS 요금 페이지는 이 항목을
"in each direction"으로 표기한다. 보내는 쪽과 받는 쪽 양쪽에 붙는다는 뜻이라,
왕복 트래픽이면 단가의 두 배로 계산해야 한다. 가용성을 위해 멀티 AZ로
구성해두면 이 트래픽은 설계상 상시로 흐른다. 그래서 "가용성 비용"의 상당
부분이 여기서 나온다.

## 원문에서 정정해야 할 부분

원문은 VPC 엔드포인트를 이렇게 설명한다.

> 다만 VPC endpoint 사용 비용이 추가로 발생하므로 사실상 무료는 아니다.
> (역시나 공짜는 없다)

**이 문장은 원문이 든 예시(EC2 → S3)에 대해서는 맞지 않는다.** VPC 엔드포인트는
두 종류이고, 둘의 요금 구조가 완전히 다르기 때문이다.

- **게이트웨이 엔드포인트** — S3와 DynamoDB 전용. 시간당 요금도, 데이터 처리
  요금도 없다.
- **인터페이스 엔드포인트(AWS PrivateLink)** — 그 외 서비스용. AZ별 시간당
  요금과 GB당 데이터 처리 요금이 붙는다.

AWS VPC 요금 페이지의 표현은 단정적이다.

> There are no data processing or hourly charges for using Gateway Type VPC
> endpoints.

([Amazon VPC Pricing](https://aws.amazon.com/vpc/pricing/))

원문의 예시는 EC2에서 S3로 데이터를 저장하는 상황이고, 여기에 맞는 건 게이트웨이
엔드포인트다. 즉 **정확히 그 예시에서는 진짜로 공짜다.** 원문이 말한 "추가 비용"은
인터페이스 엔드포인트 쪽 이야기이고, 두 종류를 구분하지 않아 생긴 서술로 보인다.

### 그럼 원래 뭐가 돈을 먹고 있었나

원문이 "엔드포인트를 쓰지 않으면 EC2 → 인터넷 → S3으로 가서 비용이 발생한다"고
한 부분은 방향은 맞다. 다만 계량기가 도는 지점이 데이터 전송 요금이 아니라
**NAT 게이트웨이**인 경우가 많다. AWS VPC 요금 페이지가 직접 이 예를 든다.

> To avoid the NAT Gateway Data Processing charge in this example, you could
> set up a gateway Type VPC endpoint and route the traffic to/from S3 through
> the VPC endpoint instead of going through the NAT Gateway.

NAT 게이트웨이는 시간당 요금과 별개로 **통과하는 데이터 GB당 처리 요금**이
붙는다. 요금 페이지의 예시는 시간당 0.045달러, GB당 0.045달러다(리전에 따라
다르므로 실제 값은 요금 페이지에서 확인할 것). 프라이빗 서브넷의 인스턴스가
S3에 뭔가를 계속 쓰고 있다면, 그 트래픽은 전부 NAT 게이트웨이를 통과하면서
GB당 과금된다.

정리하면 게이트웨이 엔드포인트를 거는 것은 "무료 대신 다른 비용을 내는 것"이
아니라 **NAT 게이트웨이 처리 요금을 없애는 것**이다. 아키텍처 문서도 같은
방향으로 설명한다.

> VPC gateway endpoints allow communication to Amazon S3 and Amazon DynamoDB
> without incurring data transfer charges within the same Region.

## 실제로 돈이 새는 자리

경계선을 알면 새는 자리도 대충 예측된다. 자주 나오는 순서대로.

- **NAT 게이트웨이** — 프라이빗 서브넷에서 나가는 모든 트래픽이 GB당 과금을
  통과한다. S3·DynamoDB는 게이트웨이 엔드포인트로 빼면 그만큼 줄어든다.
- **멀티 AZ 교차 트래픽** — 애플리케이션 서버와 DB가 다른 AZ에 있으면 쿼리
  응답이 전부 유료 구간을 지난다. 양방향 과금이라 체감보다 더 붙는다.
- **인터넷 아웃바운드** — 사용자에게 내려보내는 것 전부. 월 100GB 무료 이후로는
  선형으로 늘어난다.
- **로그와 백업** — 다른 리전으로 복제하는 순간 리전 간 전송 요금이 상시로
  붙는다. 재해 복구 구성의 숨은 고정비다.
- **퍼블릭 IPv4** — 전송량과 무관하게 개수 × 시간으로 붙는다.

## 클라이언트 개발자 입장에서

서버를 직접 운영하지 않더라도 이 구조를 알아야 하는 지점이 있다.

게임 클라이언트가 받는 것은 전부 **인터넷 아웃바운드**다. 에셋 번들, 패치
파일, 이미지, 리플레이 데이터가 모두 여기 해당한다. 즉 클라이언트 쪽에서
다운로드 용량을 줄이는 작업은 로딩 시간만이 아니라 청구서에도 직접 영향을 준다.
텍스처 압축 포맷을 바꾸거나 번들을 쪼개서 필요한 것만 받게 하는 최적화가
인프라 비용 항목과 이어져 있다는 뜻이다.

앞 글에서 다룬 것처럼 클라이언트가 외부 API를 직접 부르지 못해 백엔드 프록시를
두게 되는 경우도 마찬가지다. 프록시가 돌려주는 응답 크기가 곧 아웃바운드
전송량이 된다. 응답을 그대로 흘려보낼지, 필요한 필드만 추려 보낼지가 설계
취향 문제가 아니라 비용 문제가 되는 지점이다.

DB를 클라우드에 두는 구성이라면 축이 하나 더 생긴다. 서버가 DB에서 읽어오는
트래픽은 같은 AZ에 있으면 무료지만 AZ가 갈리면 양방향으로 과금된다. 그리고
그 결과를 클라이언트로 내려보내는 구간은 인터넷 아웃바운드다. **DB에서 읽는
양이 아니라 클라이언트에게 보내는 양이 요금의 주된 축**이라는 것부터
잡아두는 게 좋다. 조회 결과를 통째로 내려보내는 API를 짜두면 그 설계가 그대로
매월 청구서에 반영된다.

## 정리

- 원문의 구조 — 인바운드 무료, 아웃바운드는 목적지에 따라 과금 — 는 지금도
  유효하다. 숫자는 유효하지 않다.
- 월 100GB 인터넷 아웃바운드가 무료다. 서비스·리전별이 아니라 **계정 전체
  합산**이다. 이 변경은 원문 게시일보다 앞선 2021년 12월 1일에 적용됐다.
- AWS를 완전히 떠나는 경우 아웃바운드 요금을 면제받을 수 있다(신청, 90일 제한).
  유럽 데이터법의 방향을 따른 조치다.
- 2024년 2월부터 퍼블릭 IPv4는 사용 중이어도 개당 시간 0.005달러로 과금된다.
- 게이트웨이 엔드포인트(S3·DynamoDB)는 시간당 요금도 데이터 처리 요금도 없다.
  원문의 "사실상 무료는 아니다"는 인터페이스 엔드포인트에 해당하는 이야기다.
- 엔드포인트로 실제로 없애는 비용은 데이터 전송 요금이 아니라 NAT 게이트웨이
  데이터 처리 요금인 경우가 많다.
- AZ 경계 트래픽은 양방향으로 과금된다. 멀티 AZ 구성의 상시 비용이 여기서 나온다.

## 참고

- [EC2 온디맨드 요금 — Amazon Web Services](https://aws.amazon.com/ec2/pricing/on-demand/)
- [Amazon VPC Pricing](https://aws.amazon.com/vpc/pricing/)
- [AWS Free Tier Data Transfer Expansion — AWS News Blog](https://aws.amazon.com/blogs/aws/aws-free-tier-data-transfer-expansion-100-gb-from-regions-and-1-tb-from-amazon-cloudfront-per-month/)
- [Free Data Transfer Out to Internet When Moving Out of AWS — AWS News Blog](https://aws.amazon.com/blogs/aws/free-data-transfer-out-to-internet-when-moving-out-of-aws/)
- [New AWS Public IPv4 Address Charge — AWS News Blog](https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights/)
- [Overview of Data Transfer Costs for Common Architectures — AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/)
- 원문: [AWS 데이터 전송비용 정리](https://ltlkodae.tistory.com/27)
