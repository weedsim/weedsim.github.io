---
pubDatetime: 2026-08-28T12:00:00+09:00
title: "서명된 APK 뽑기: 진짜 결과물은 APK가 아니라 키스토어다"
lang: ko
translationKey: android-signed-apk
featured: false
draft: false
tags:
  - 안드로이드
  - 안드로이드 스튜디오
  - 앱 서명
  - 키스토어
  - Gradle
  - Unity
description: "오픈 소스 앱을 직접 빌드해보려다 정리한 글. Android Studio의 Generate Signed Bundle/APK 절차와, 이 절차에서 한 번 만들면 되돌릴 수 없는 키스토어를 어디에 두어야 하는지, Play의 AAB 요구와 앱 서명이 무엇을 바꿨는지까지 짚었다."
---

오픈 소스로 공개된 안드로이드 앱을 하나 쓰려던 참이었다. Play 스토어에서
그냥 받아도 되지만, 스토어에 올라온 바이너리가 공개된 소스와 같다는 보장이
그 자체로 주어지지는 않는다. 코드를 직접 확인하고 보안 점검도 해보고 싶어서
소스를 받아 로컬에서 빌드하기로 했고, 그러면서 APK를 뽑는 방법을 정리해뒀던
자료가 이 글의 바탕이다.

그런데 이렇게 직접 빌드한 APK는 스토어에서 받은 앱을 덮어쓰지 못한다.
패키지명이 같아도 **서명 키가 다르면 안드로이드가 업데이트로 인정하지
않기** 때문이다. `adb install`은 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`로
떨어지고, 기존 앱을 지운 뒤에야 설치된다. 소스를 직접 빌드해서 검증한다는
건 결국 내 키로 서명한 별개의 앱을 하나 더 만드는 일이라는 뜻이다.

그래서 서명이 이 절차의 곁가지가 아니라 본론이 된다. 절차 자체는 마법사 몇
화면이라 검색하면 스크린샷 따라가기 글이 잔뜩 나오는데, 그 글들이 대부분
공통으로 빠뜨리는 게 있다. 이 마법사에서 진짜로
중요한 건 마지막에 떨어지는 APK가 아니라, 중간에 지나가듯 만드는
**키스토어**라는 것이다. APK는 다시 빌드하면 되지만 키스토어는 잃어버리면
끝이다.

## 목차

## 절차 자체는 짧다

Android Studio 기준 흐름은 이렇다.

1. 메뉴에서 **Build > Generate Signed Bundle/APK**
2. **APK**와 **Android App Bundle** 중 선택
3. 키를 지정한다. 처음이라면 **Create new...**
4. 키스토어를 저장할 경로, 키스토어 비밀번호, 키 별칭(alias), 키 비밀번호,
   유효기간, 그리고 인증서에 들어갈 이름 정보를 입력
5. 빌드 변형에서 **release**를 고르고 **Create**
6. 빌드가 끝나면 우측 알림에서 **locate**를 눌러 결과물 위치로 이동

메뉴 이름은 공식 문서 표기와 같다. Android 개발자 문서
[App signing](https://developer.android.com/studio/publish/app-signing)의
표현은 다음과 같다.

> In the menu bar, click **Build > Generate Signed Bundle/APK**.

여기까지가 클릭 순서다. 문제는 4번 화면에서 입력하는 것들이 무엇인지 모르고
지나가면, 나중에 되돌릴 방법이 없다는 것이다.

## 키스토어와 키가 실제로 무엇인가

용어가 두 층으로 겹쳐 있어서 헷갈리기 쉽다.

- **키스토어(keystore)** — 개인 키와 공개 키 인증서를 담는 바이너리 파일
  하나(`.jks`, `.keystore`). 금고에 해당한다.
- **키(key) / 별칭(alias)** — 키스토어 안에 들어 있는 개별 키. 금고 안의
  칸이다. 하나의 키스토어에 여러 개를 넣을 수 있고, 그래서 별칭으로 구분한다.

비밀번호를 두 번 입력받는 이유도 여기 있다. **키스토어 비밀번호**는 금고를
여는 것이고, **키 비밀번호**는 그 안의 특정 칸을 여는 것이다. 둘을 같게
설정할 수도 있지만 개념상 다른 값이다.

원문 글에서 "인증을 위해 First and Last Name 부분에 정보를 기입"하라고 한
부분은 X.500 형식의 인증서 주체 정보를 채우는 칸이다. `First and Last Name`이
CN(Common Name)에 해당하고, 그 아래 Organizational Unit, Organization,
City, State, Country Code는 각각 OU, O, L, ST, C다. 자체 서명 인증서라
검증 기관이 따로 없으므로 여기 적힌 값이 곧 "이 앱을 서명한 주체"의 표기가
된다. 원문 말대로 CN만 채워도 빌드는 되지만, 배포용이라면 나중에
`apksigner`로 인증서를 출력했을 때 자기 앱이라고 알아볼 수 있는 값을
넣어두는 편이 낫다.

## 이 절차의 진짜 결과물은 키스토어다

### 잃어버리면 끝이다

공식 문서가 이 부분을 가장 강한 어조로 쓴다.

> Your private key is required for signing all future versions of your app.
> If you lose or misplace your key, you will not be able to publish updates
> to your existing app. You cannot regenerate a previously generated key.

안드로이드는 **같은 패키지명 + 같은 서명 키**를 가진 APK만 기존 앱의
업데이트로 인정한다. 키가 다르면 업데이트가 아니라 완전히 다른 앱이고,
기기에 설치된 기존 버전 위에 덮어쓸 수 없다. 사용자는 지우고 새로 깔아야
하며, 그 순간 앱 데이터도 같이 날아간다. 스토어에 올린 앱이라면 아예
업데이트를 올릴 수 없다.

즉 이 마법사에서 만드는 `.jks` 파일 하나가 앱의 수명 전체를 붙잡고 있다.
개인 프로젝트라도 처음 만들 때 백업 위치를 정해두는 편이 좋다.

### 유효기간

기본값을 그냥 넘기기 쉬운 칸이지만 기준이 있다.

> Your key should be valid for at least 25 years, so you can sign app updates
> with the same key through the lifespan of your app.

Google Play에 올릴 계획이라면 조건이 하나 더 붙는다.

> If you plan to publish your apps on Google Play, the key you use to sign
> your app must have a validity period ending after 22 October 2033.

25년은 넉넉해 보이지만, 이 값은 나중에 늘릴 수 없다. 만료되면 그 키로 서명한
업데이트를 배포할 수 없게 된다.

### 디버그 키스토어는 릴리스에 못 쓴다

IDE에서 그냥 Run을 눌러도 앱이 기기에 설치되는 건 이미 서명이 붙기
때문이다. 다만 그건 디버그 인증서다.

> The first time you run or debug your project in Android Studio, the IDE
> automatically creates the debug keystore and certificate in
> `$HOME/.android/debug.keystore`, and sets the keystore and key passwords.

이 인증서는 배포에 쓸 수 없다.

> Because the debug certificate is created by the build tools and is insecure
> by design, most app stores (including the Google Play Store) do not accept
> apps signed with a debug certificate for publishing.

비밀번호가 공개된 고정값이므로 아무나 같은 키로 서명할 수 있다. 릴리스
키스토어를 따로 만드는 이유가 이것이다.

## 원문에서 한 군데 걸리는 부분

이 글의 바탕이 된
[원문](https://jindevelopetravel0919.tistory.com/374)에는 키스토어 저장
경로를 고르는 화면에서 이런 조언이 있다.

> 웬만하면 현재 진행 중인 프로젝트 폴더를 선택해주는 것이 좋습니다.

찾기 편하다는 점에서는 이해가 되지만, **프로젝트가 git으로 관리되고 있다면
이건 위험한 기본값이다.** 프로젝트 루트에 `.jks`를 만들어두면 다음 `git add`
때 서명 키가 그대로 커밋된다. 공개 저장소라면 그 시점에 키는 유출된 것이고,
나중에 파일을 지워도 커밋 히스토리에는 남는다.

공식 문서의 방향은 반대다.

> Keep the keystore file containing your private key in a safe, secure place.

> If you are working with a team or open-sourcing your code, you should move
> this sensitive information out of the build files so it is not easily
> accessible to others.

> Be sure to keep the `keystore.properties` file secure. This may include
> removing it from your source control system.

원문이 "틀렸다"기보다는, git을 쓰지 않는 개인 실습을 전제한 조언이 그대로
남은 경우로 보인다.

### 기준은 폴더 안팎이 아니라 저장소의 성격이다

그러면 프로젝트 폴더 밖에 두면 해결되느냐 하면, 그것도 아니다. "폴더 안에
두되 `.gitignore`에 넣는다"와 "폴더 밖에 둔다"를 백업 관점에서 비교하면
**차이가 없다.** 둘 다 버전 관리에 들어가지 않으므로 백업은 어느 쪽이든
별도 수단으로 해결해야 한다.

즉 폴더 안팎은 판단 기준이 아니다. 실제로 갈라야 하는 건 **이 저장소가
공개되거나 공유되는가**다.

### 비공개 개인 저장소 — 백업이 목적이라면

혼자 쓰는 비공개 저장소라면, 키스토어를 커밋해서 저장소를 백업 수단으로
쓰는 게 실용적인 선택일 수 있다. 원격에 사본이 남고 이력도 따라오니 목적에는
맞는다. 다만 세 가지가 조건으로 붙는다.

- **비밀번호는 같이 올리지 않는다.** `.jks`는 비밀번호로 보호된 파일이다.
  파일만 올라간 것과 `keystore.properties`까지 같이 올라간 것은 위험도가
  완전히 다르다. 후자는 보호막이 통째로 사라진 상태다.
- **그 파일의 방어선은 비밀번호 하나뿐이다.** 저장소가 어떤 경로로든 새면
  남는 건 비밀번호를 맞히는 문제뿐이므로, 형식과 비밀번호 강도가 그대로
  방어력이 된다. 참고로 `keytool`은 예전 JKS 형식에 대해 proprietary
  format이라며 PKCS12로 옮길 것을 권고하고, JDK 9부터는 기본 형식도
  PKCS12다.
- **저장소의 공개 여부는 나중에 바뀔 수 있다.** public 전환, 포크, 조직
  이관, 협업자 추가 중 하나만 생겨도 이력에 들어간 키는 그대로 따라간다.
  파일을 지워도 과거 커밋에는 남고, 서명 키는 폐기하고 새로 발급하는 게
  불가능하니 되돌릴 방법이 사실상 없다. 그래서 이건 "지금 비공개"가 아니라
  **"앞으로도 공개할 일이 없다"**까지 확신할 때 택하는 선택지다.

### 공개·공유가 목적이라면

오픈소스나 팀 저장소처럼 저장소 자체가 공개·공유되는 경우에는 `.gitignore`
처리가 전제다. 여기서 두 가지를 더 챙겨야 한다.

- **비밀번호뿐 아니라 경로도 노출 대상이다.** `build.gradle`에 `storeFile`을
  절대 경로로 박아두면 사용자명과 디렉터리 구조가 그대로 공개된다. 그 자체가
  치명적이진 않아도, 저장소를 읽는 쪽에 무엇을 어디서 찾으면 되는지 알려주는
  정보다. 경로와 비밀번호를 함께 `keystore.properties`나 환경변수로 빼고
  빌드 스크립트에는 키 이름만 남기는 이유가 여기 있다.
- **실수로 올라가는 경로를 계속 의식해야 한다.** `.gitignore`는 규칙일 뿐
  강제가 아니다. `git add -f`, `.gitignore`를 잘못 손댄 커밋, 그 규칙이 없는
  다른 클론, ignore를 보지 않는 배포·압축 스크립트로 얼마든지 들어간다. 한 번
  올라가면 앞서 말한 대로 파일을 지워도 이력에는 남는다.

반대 방향의 사고도 하나 있다. `git clean -fdx`는 ignore된 파일까지 지우므로,
프로젝트 폴더 안에 두고 백업을 따로 안 해뒀다면 그 명령 하나로 키를 잃는다.

### 프로젝트 폴더 밖은 혼자 쓸 때

작업 트리 밖이라 실수로 커밋될 경로가 없고 `git clean`에도 걸리지 않는 게
장점이지만, 경로가 머신마다 달라서 그대로는 공유가 안 된다. 그래서 이건
**개인이 혼자 쓰는 상황에서 고르는 선택지**로 보는 게 맞다. 팀이라면 어차피
비밀 관리 도구나 CI의 시크릿 저장소를 거쳐 빌드 서버만 키를 꺼내 쓰는 구조로
가게 되고, 그 시점에서 "내 PC 어디에 두느냐"는 질문 자체가 의미를 잃는다.

Unity 문서가 같은 트레이드오프를 반대편에서 서술하는데, 이 문장을 보면 왜
헷갈리기 쉬운지도 같이 드러난다. 키스토어를 별도 경로에 두는 선택지를
설명하면서 이렇게 적는다.

> However, as the dedicated location is outside the Project folder, the
> keystore file isn't tracked by version control, and hence not accessible
> for collaboration.

"프로젝트 밖에 두면 버전 관리에 안 들어가서 협업에 쓸 수 없다"는 말은
**프로젝트 안에 두면 버전 관리에 들어간다**는 것을 전제로 한 문장이다.
그러니까 여기서 말하는 "협업 가능"은 곧 "서명 키가 저장소에 올라간다"는
뜻이다. 앞의 기준에 대보면, 이건 비공개 개인 저장소에서만 조건부로 성립하는
이야기다. 그런데 "협업"이라고 부르는 상황은 정의상 저장소를 공유하는
경우이고, 거기서는 `.gitignore`를 걸어야 한다. 그 순간 Unity가 말한 장점은
사라지고 위치 선택만 남는다.
([Create a new keystore](https://docs.unity3d.com/Manual/android-keystore-create.html))

`.gitignore`는 저장소 성격에 따라 이렇게 갈린다.

```gitignore
# 비밀번호와 경로 — 저장소 성격과 무관하게 항상 제외
keystore.properties

# 키스토어 파일 — 공개·공유되는 저장소라면 제외
*.jks
*.keystore
```

## APK인가 AAB인가

마법사 두 번째 화면에서 APK와 Android App Bundle 중 하나를 고르게 되는데,
2024년에 쓰인 원문은 APK를 골랐다. 지금 기준으로는 목적지에 따라 갈린다.

> From August 2021, new apps are required to publish with the Android App
> Bundle on Google Play.

Google Play에 **새 앱**을 올릴 거라면 APK로는 올릴 수 없다. AAB를 올리면
Play가 기기 구성별로 최적화된 APK를 만들어 배포한다.

> Google Play uses your app bundle to generate and serve optimized APKs for
> each device configuration, so only the code and resources that are needed
> for a specific device are downloaded to run your app.

그럼 APK는 죽었느냐 하면 그렇지 않다. AAB는 배포 포맷이지 설치 포맷이 아니다.
기기에 실제로 설치되는 건 여전히 APK이고, 다음 경우에는 APK를 직접 뽑는 게
맞다.

- 폰에 파일을 직접 넣어 설치하는 경우(사이드로딩)
- QA 배포, 사내 배포, 테스터에게 파일로 전달
- Play가 아닌 스토어나 자체 배포 채널

원문이 다루는 "APK를 추출해서 핸드폰에 넣어 설치한다"는 시나리오는 여기에
해당하므로, 그 자체로는 지금도 유효하다. 다만 그 절차가 곧 Play 출시 절차는
아니라는 점만 구분하면 된다.

## Play 앱 서명 — 업로드 키와 앱 서명 키

Play에 올린다면 키가 하나 더 생긴다. Play 앱 서명(Play App Signing)에서는
키가 두 종류로 나뉜다.

- **앱 서명 키(app signing key)** — 사용자 기기에 설치되는 APK에 실제로
  붙는 키. Play가 보관한다.
- **업로드 키(upload key)** — 내가 AAB나 APK를 Play에 업로드할 때 서명하는 키.

이 구분이 실질적으로 바꾸는 건 "키를 잃어버렸을 때"다.

> When you use Play App Signing, if you lose your upload key, or if it is
> compromised, you can request an upload key reset in the Play Console.
> Because your app signing key is secured by Google, you can continue to
> upload new versions of your app as updates to the original app, even if you
> change upload keys.

반대의 경우는 여전히 회복 불가다.

> By comparison, for apps that have not opted in to Play App Signing, if you
> lose your app's signing key, you lose the ability to update your app.

즉 Play 앱 서명을 쓰면 앞에서 말한 "잃어버리면 끝"이 업로드 키에 한해
완화된다. 반대로 Play를 거치지 않고 직접 배포하는 앱은 완화 장치가 없으므로,
키스토어 관리가 전적으로 본인 책임이다.

## 마법사를 매번 클릭할 필요는 없다

릴리스를 몇 번 뽑다 보면 이 마법사를 반복해서 클릭하는 게 금방 귀찮아진다.
서명 설정을 Gradle에 넣어두면 `Build > Build Bundle(s) / APK(s)`만으로
서명된 결과물이 나온다.

다만 비밀번호를 빌드 스크립트에 그대로 적으면 안 되므로, 공식 문서가
권하는 방식은 값을 별도 파일로 빼는 것이다. 프로젝트 루트에
`keystore.properties`를 만든다.

```properties
storePassword=myStorePassword
keyPassword=mykeyPassword
keyAlias=myKeyAlias
storeFile=myStoreFileLocation
```

그리고 `build.gradle.kts`에서 읽어 쓴다.

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
keystoreProperties.load(FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        create("config") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
}
```

이렇게 하면 `build.gradle.kts`는 커밋해도 되고, `keystore.properties`만
`.gitignore`에 넣으면 된다. 위의 `.gitignore` 예시에 이미 포함해뒀다.

## 서명이 제대로 붙었는지 확인하기

빌드가 됐다고 원하는 키로 서명됐다는 보장은 없다. 특히 디버그 키로
서명된 걸 모르고 배포하는 실수가 흔하다. SDK Build Tools에 들어 있는
[`apksigner`](https://developer.android.com/tools/apksigner)로 확인할 수 있다.

```bash
# <SDK>/build-tools/<version>/apksigner
apksigner verify --print-certs app-release.apk
```

인증서의 주체(Subject)와 지문(SHA-256)이 출력된다. 디버그 키로 서명됐다면
`CN=Android Debug`가 보인다.

키스토어 쪽을 직접 보고 싶으면 JDK의 `keytool`을 쓴다.

```bash
keytool -list -v -keystore my-release-key.jks -alias my-alias
```

별칭 목록, 인증서 지문, 그리고 유효기간이 나온다. 앞에서 말한 2033년 조건을
확인할 때 이걸 보면 된다.

## Unity에서는 어디에 있나

Unity로 안드로이드 빌드를 하는 경우에도 같은 개념이 그대로 적용된다.
위치만 다르다.

**Edit > Project Settings > Player > Android > Publishing Settings**에
키스토어 설정이 있고, 여기서 **Keystore Manager** 창을 연다.
([Keystore Manager window reference](https://docs.unity3d.com/Manual/android-keystore-manager.html))

- 키스토어를 새로 만들거나 기존 것을 불러온다.
- 키를 추가할 때 별칭, 비밀번호, **Validity (years)** 를 입력한다. Unity의
  기본값은 50년이다.
- 이름 정보(First and Last Name, Organization, City, State, Country Code)는
  Android Studio 마법사와 같은 X.500 필드다.

주의할 점 몇 가지.

- **아무 설정도 하지 않으면 Unity도 디버그 키로 서명한다.** 개발 중에는
  문제가 없지만 그대로 배포하면 안 된다.
- 저장 위치는 프로젝트 폴더(**Anywhere**)와 **In Dedicated Location** 중에서
  고른다. 앞에서 정리한 기준이 그대로 적용된다. 공개하거나 팀과 공유하는
  프로젝트면 `.gitignore` 처리가 반드시 따라와야 하고, 그렇게 한 시점에서
  Unity 문서가 말하는 "협업 가능"이라는 이점은 없어진다. 별도 경로는 혼자
  쓸 때 고르는 쪽이다.
- Google Play용이면 Build Settings에서 **Build App Bundle (Google Play)** 를
  켜서 AAB로 뽑는다. 사이드로딩용이면 끄고 APK로 뽑는다.

## 정리

- 직접 빌드한 APK는 스토어에서 받은 앱을 덮어쓰지 못한다. 서명 키가 다르면
  패키지명이 같아도 별개의 앱이다.
- 이 마법사가 만드는 것 중 되돌릴 수 없는 건 APK가 아니라 키스토어다.
- 키를 잃으면 같은 앱의 업데이트를 영원히 낼 수 없다. 유효기간은 최소 25년,
  Play라면 2033년 10월 22일 이후까지.
- 판단 기준은 폴더 안팎이 아니라 저장소가 공개·공유되는가다. 혼자 쓰는
  비공개 저장소라면 백업 목적의 커밋도 선택지지만, 비밀번호는 빼고 올려야
  하고 공개 여부가 나중에 바뀔 수 있다는 것까지 감안해야 한다. 공개·공유되는
  저장소라면 `.gitignore`가 전제이고, 비밀번호뿐 아니라 키스토어 경로도
  노출 대상이다. 프로젝트 폴더 밖은 혼자 쓸 때 고르는 선택지다.
- Play 신규 앱은 2021년 8월부터 AAB만 받는다. APK는 사이드로딩·QA·자체
  배포에서 여전히 쓴다.
- Play 앱 서명을 쓰면 업로드 키는 분실해도 재설정할 수 있다. 앱 서명 키는
  Google이 보관한다.
- 반복 빌드는 `keystore.properties` + `signingConfigs`로 자동화하고,
  결과물은 `apksigner verify --print-certs`로 확인한다.
- Unity도 개념은 같다. Publishing Settings의 Keystore Manager, 그리고
  기본이 디버그 키라는 점만 기억하면 된다.

## 참고

- [Sign your app — Android Developers](https://developer.android.com/studio/publish/app-signing)
- [About Android App Bundles — Android Developers](https://developer.android.com/guide/app-bundle)
- [apksigner — Android Developers](https://developer.android.com/tools/apksigner)
- [Keystore Manager window reference — Unity](https://docs.unity3d.com/Manual/android-keystore-manager.html)
- [Create a new keystore — Unity](https://docs.unity3d.com/Manual/android-keystore-create.html)
- 원문: [\[Android Studio\] 안드로이드 스튜디오 APK 추출](https://jindevelopetravel0919.tistory.com/374)
