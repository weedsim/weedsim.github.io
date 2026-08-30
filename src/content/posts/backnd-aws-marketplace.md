---
pubDatetime: 2026-08-30T17:00:00+09:00
title: "AWS 마켓플레이스로 뒤끝 구독하기: 경고문이 왜 붙어 있는지부터"
lang: ko
translationKey: backnd-aws-marketplace
featured: false
draft: false
tags:
  - 뒤끝
  - AWS
  - BaaS
  - 게임 서버
  - 요금
description: "뒤끝을 AWS 마켓플레이스에서 구독하는 절차와, 안내문에 붙은 두 개의 경고가 왜 붙어 있는지를 AWS SaaS 온보딩 구조로 설명했다. 해지가 무엇을 정지시키는지와 요금이 어디에 적혀 있는지도 정리했다."
---

앞 글에서 게임 프로젝트의 DB를 AWS에 두는 구성을 놓고 전송 비용을 따져봤는데,
그 반대편 선택지도 같이 보고 있었다. 서버를 직접 구성하지 않고 게임 백엔드를
서비스로 빌려 쓰는 쪽이다. 그러다
[뒤끝이 AWS 마켓플레이스에 올라왔다는 공지](https://blog.thebackend.io/awsmarketplaceguide/)를
스크랩해뒀었다.

내용 자체는 구독 절차 안내다. 그런데 안내문 중간에 붙은 경고 두 개가 눈에
걸렸다. **"뒤끝 콘솔에서 직접 회원가입할 경우 AWS 계정과 연동되지 않는다"**와
**"가입 도중 인증 토큰이 만료되면 구독을 해지하고 다시 시작해야 한다"**는 것이다.
절차대로만 하면 될 일이지만, 왜 이런 제약이 생기는지 모르면 실제로 막혔을 때
뭘 해야 할지 알 수 없다. 그래서 그 구조부터 정리했다.

## 목차

## 뒤끝이 무엇인가

뒤끝(BACKND)은 게임 백엔드를 서비스로 제공하는 BaaS다. 운영사는 서울에 있는
**AFI, Inc.**이고, Unity와 Unreal을 지원한다.

AWS 마켓플레이스 리스팅의 소개는 이렇다.

> a cloud-based backend service that enables game developers to integrate
> essential server features

기능 범위는 게임 백엔드에서 반복적으로 필요한 것들이다. 소셜 로그인 인증,
게임 데이터 저장, 랭킹, 친구·길드, 우편, 쿠폰, 푸시 알림, 영수증 검증,
매칭(BACKND Match), 서버리스 함수(BACKND Function) 같은 것들. 서버를 직접
짜면 매번 다시 만들게 되는 층이다.

요금은 사용량 기반이고, 고정 월정액이 없다. 뒤끝 요금 페이지 기준으로 FREE /
Basic / Enterprise 세 단계이며 FREE 구간이 꽤 넓다. 기능별로 월 무료 호출 수가
따로 잡혀 있고(대부분의 Base 기능 월 5만 호출, 푸시 100만 건, DB 읽기·쓰기 각
100만 회와 저장 5GB 등), 초과분은 기능별 단가로 과금된다.

## 마켓플레이스로 구독하면 뭐가 달라지나

먼저 짚을 것은 **기능이 달라지지 않는다**는 점이다. 마켓플레이스는 유통·결제
경로이지 다른 제품이 아니다. 달라지는 건 돈이 흐르는 경로다.

AWS가 SaaS 구매의 이점으로 내세우는 표현은 이렇다.

> Find, try, buy, and launch SaaS applications fast, while consolidating
> billing on AWS.

즉 뒤끝에 따로 결제 수단을 등록하는 대신 **AWS 청구서 한 장에 합쳐진다.**
이미 AWS를 쓰고 있다면 정산 창구가 하나로 줄고, 조직에 따라서는 기존 AWS
계약이나 약정 지출과 엮을 수 있다. 개인 개발자라면 체감이 크지 않지만, 결제
승인 절차가 있는 팀이라면 이게 도입 난이도를 실제로 낮춘다.

마켓플레이스 리스팅에서 확인되는 요금 축은 **"BACKND Total Usage (Server API
Usage)" 단일 항목이고 단위당 0.01달러**로 표기된다. 반면 뒤끝 자체 요금표는
기능별로 훨씬 잘게 쪼개져 있다(운영 관리 호출당 0.000018달러, 사용자 관리
0.000027달러, 랭킹 0.000036달러, DB 저장 GB·일당 0.015364달러 등).

두 숫자의 자릿수가 다르니 **마켓플레이스의 "unit"은 개별 API 호출이 아니라
과금 단위**로 보는 게 맞다. 실제 단가를 알고 싶으면 마켓플레이스 페이지가 아니라
뒤끝 요금 페이지를 봐야 한다는 뜻이다. 마켓플레이스 페이지의 숫자만 보고
비용을 추정하면 어긋난다.

> 확인해봐야 할 것: 마켓플레이스를 통해 가입한 계정에도 FREE 구간이 그대로
> 적용되는지는 양쪽 문서 어디에도 명시가 없다. 무료 구간을 전제로 시작할
> 계획이라면 구독 전에 문의로 확인하는 편이 안전하다.

## 구독 절차

공지 기준 흐름은 다섯 단계다.

1. AWS 마켓플레이스의 뒤끝 페이지에서 서비스 내용과 요금, 지원 정보를 확인한다.
2. 상세 페이지 우측 상단의 **View purchase options**를 눌러 구독 페이지로 간다.
3. 요금을 확인하고 하단의 **Subscribe**를 누른다.
4. 구독이 끝나면 페이지 상단의 **Set up your account** 버튼을 누른다. 뒤끝
   가입 페이지로 넘어가고, 여기서 이메일과 비밀번호로 가입한다.
5. 계정 연동은 자동으로 이뤄지고 바로 사용할 수 있다.

4번이 전부다. 그런데 이 한 단계에 경고 두 개가 붙어 있다.

## 경고문이 왜 붙어 있나

두 경고 모두 AWS 마켓플레이스의 SaaS 온보딩이 어떻게 설계되어 있는지에서
나온다. AWS 판매자 문서가 이 흐름을 설명한다.

구독이 완료되면 AWS가 구매자를 식별하는 토큰을 만든다.

> A registration token is generated for the customer that contains their AWS
> account ID, customer identifier, and your product code.

그리고 **Set up your account**를 누르면, 브라우저가 판매자의 가입 페이지로
이 토큰을 담아 POST를 보낸다.

> The customer's browser sends a `POST` request to your software's
> registration landing page URL. The request contains one `POST` parameter,
> `x-amzn-marketplace-token`, containing the customer's registration token.

판매자 쪽은 이 토큰을 AWS에 되물어서 실제 고객 식별자로 바꾼다.

> To redeem this registration token for a customer AWS account ID, customer
> identifier, and product code, your website must call ResolveCustomer on the
> AWS Marketplace Metering Service.

여기까지 보면 두 경고가 설명된다.

### "콘솔에서 직접 가입하면 연동되지 않는다"

AWS 계정과 뒤끝 계정을 잇는 정보는 **오직 저 토큰에만 들어 있다.** 뒤끝
사이트에서 직접 가입하면 브라우저가 토큰을 실어 보내는 POST 자체가 없으므로,
뒤끝 입장에서는 이 사람이 어느 AWS 구독에 해당하는지 알 방법이 없다. 그래서
연동이 "안 되는" 게 아니라 연동할 재료가 없는 것이다.

`Set up your account` 버튼이 단순한 링크가 아니라 **토큰을 담은 폼 제출**이라는
점이 핵심이다. 이 버튼을 거치지 않으면 나머지 절차가 아무리 정확해도 연결되지
않는다.

### "인증 토큰이 만료되면 다시 구독해야 한다"

토큰에는 수명이 있다. AWS 문서의 표현은 이렇다.

> The registration token resolves to a specific subscribed customer and each
> generated token has an expiration window of 4 hours.

그리고 같은 문서가 곧바로 덧붙인다.

> We recommend that you resolve the registration token immediately because it
> may expire after approximately one hour.

즉 4시간이 상한이되 실질적으로는 **한 시간 안에 처리하라**는 안내다. 구독은
됐는데 가입 화면을 띄워놓고 다른 일을 하다 돌아오면 이 창을 넘길 수 있다.
토큰이 만료되면 새 토큰을 발급받아야 하는데, 토큰은 구독 시점에 생성되는
것이므로 결국 **해지 후 재구독**이라는 안내가 나오는 것이다.

실무적으로는 간단하다. **구독 버튼을 누르기 전에 가입에 쓸 이메일과 비밀번호를
미리 정해두고, 구독 직후 한 번에 4단계까지 끝낼 것.** 중간에 자리를 뜨지 않는
것만으로 이 문제는 안 생긴다.

## 해지가 무엇을 정지시키는가

여기가 도입 전에 가장 신중해야 할 부분이다. 공지의 표현은 이렇다.

> 회원님의 뒤끝 계정과 모든 프로젝트가 정지됩니다.

구독 하나가 계정 전체에 걸려 있다는 뜻이다. 프로젝트 단위가 아니라 계정
단위이므로, 마켓플레이스 구독을 정리하면 그 계정으로 만든 모든 프로젝트가
함께 멈춘다. 그래서 공지도 해지 전 백업을 먼저 하라고 안내한다.

완전히 소실되는 것은 아니다. 공지에 따르면 **일반 뒤끝 계정**(마켓플레이스가
아니라 뒤끝 공식 사이트에서 직접 가입한 계정)으로 전환해 복구할 수 있고,
계정 전환 문의는 `help@backnd.com`으로 받는다. 다만 조건이 붙는다.

> 복구 시에는 해지 기간 동안 발생한 소량의 데이터 저장 비용이 청구될 수 있습니다.

정리하면 마켓플레이스 계정과 일반 계정 사이의 전환은 **수동 절차**다. 셀프
서비스로 토글하는 스위치가 아니라 문의를 넣어야 하는 일이다. 결제 경로를
AWS로 통합하는 대가로, 계정의 소속을 바꾸는 일이 그만큼 뻑뻑해진다.

## 직접 만들 것인가, 빌릴 것인가

앞 글에서 본 것처럼 AWS에 DB를 직접 올리면 인스턴스 요금 외에 NAT 게이트웨이,
AZ 간 트래픽, 인터넷 아웃바운드가 각각 별도 항목으로 붙는다. 이 항목들은
게임 로직과 무관하게 **구성만으로 발생**한다.

BaaS는 그 항목들을 요금 하나로 흡수한다. 사용량 기반이고 무료 구간이 있으니
초기 비용은 0에 가깝고, 대신 단가가 벤더가 정한 값이며 나중에 바꿀 수 없다.

- **직접 구축** — 단가가 낮고 통제권이 있다. 대신 구성 항목마다 요금이 붙고,
  그걸 관리할 사람이 필요하다.
- **BaaS** — 초기 비용과 운영 부담이 낮다. 대신 스케일이 커질수록 단가 차이가
  누적되고, 옮기려면 데이터와 코드를 모두 들어내야 한다.

여기에 마켓플레이스 구독은 한 겹을 더 얹는다. **뒤끝에 묶이는 것에 더해,
그 계정이 특정 AWS 계정의 구독에 묶인다.** AWS 계정을 정리하거나 조직 계정으로
옮길 일이 생기면 이 연결도 같이 정리해야 한다.

## 구독 전에 확인할 것

- **Set up your account 버튼으로만 가입한다.** 뒤끝 사이트에서 먼저 가입해두면
  안 된다.
- **구독과 가입을 한 번에 끝낸다.** 토큰 수명이 한 시간 안팎이다.
- **계정을 누구 명의로 만들 것인지 먼저 정한다.** 개인 AWS 계정으로 구독해두면
  나중에 팀·법인 계정으로 옮기는 게 문의 절차가 된다.
- **무료 구간이 그대로 적용되는지 확인한다.** 문서에 명시가 없다.
- **해지는 계정 전체를 멈춘다.** 프로젝트 단위가 아니다. 정리 전 백업이 먼저다.
- **원문 공지는 2025년 8월 이후 갱신되지 않았다.** 마켓플레이스 화면과 버튼
  이름은 바뀔 수 있으니, 실제 화면을 기준으로 볼 것.

## 정리

- 뒤끝은 AFI, Inc.가 운영하는 게임 BaaS다. Unity·Unreal을 지원하고 요금은
  사용량 기반이며 FREE 구간이 있다.
- 마켓플레이스 구독은 기능을 바꾸지 않는다. 결제가 AWS 청구서로 합쳐진다.
- "콘솔에서 직접 가입하면 연동 안 된다"는 경고는, AWS 계정과 뒤끝 계정을 잇는
  정보가 `Set up your account` 버튼이 POST하는 등록 토큰에만 들어 있기 때문이다.
- "토큰 만료" 경고는 그 토큰의 수명이 최대 4시간, 권장은 한 시간 이내이기
  때문이다. 구독과 가입을 붙여서 끝내면 겪지 않는다.
- 해지는 프로젝트가 아니라 **계정 전체**를 정지시킨다. 일반 계정으로 전환해
  복구할 수 있지만 문의를 통한 수동 절차이고, 정지 기간의 저장 비용이 청구될
  수 있다.
- 요금 추정은 마켓플레이스 페이지의 단일 항목이 아니라 뒤끝 요금 페이지를
  기준으로 해야 한다.

## 참고

- [Onboarding customers to your SaaS product through AWS Marketplace — AWS Marketplace](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-product-customer-setup.html)
- [Software as a Service (SaaS) in AWS Marketplace](https://aws.amazon.com/marketplace/features/software-as-a-service-saas)
- [AWS Marketplace: BACKND](https://aws.amazon.com/marketplace/pp/prodview-ggswe3jeapilc)
- [BACKND](https://backnd.com/en/) / [뒤끝 SDK 문서](https://developer.thebackend.io/unity3d/main/)
- 원문: [AWS 마켓플레이스를 통해 뒤끝을 구독하는 방법](https://blog.thebackend.io/awsmarketplaceguide/)
