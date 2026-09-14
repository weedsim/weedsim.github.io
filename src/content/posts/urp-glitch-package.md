---
pubDatetime: 2026-09-14T16:00:00+09:00
title: "포크 세 번 끝에 공식판이 나왔다"
lang: ko
translationKey: urp-glitch-package
featured: false
draft: false
tags:
  - Unity
  - URP
  - 렌더링
  - 셰이더
  - 글리치
  - 그래픽스
description: "URP용 글리치 이펙트 패키지의 README를 스크랩해뒀었다. 지금 그 저장소를 열면 저자가 더 이상 갱신하지 않는다는 공지와 함께 keijiro의 공식 URP판을 가리킨다."
---

게임 프로젝트에 글리치 효과를 연출로 넣으려고 쓰는 법을 찾아보던 중에,
URP용 글리치 이펙트 패키지 `saimarei/URPGlitch`의
[README](https://github.com/saimarei/URPGlitch)를 스크랩해뒀었다. 설치 방법
세 가지와 렌더러 피처·볼륨 설정 순서가 적혀 있어서 그대로 따라 할 수 있는
문서다.

지금 그 저장소를 열면 **README 맨 위에 공지가 하나 붙어 있다.**

> I have moved on to using the **Godot engine** and will no longer be updating
> this repository.

그리고 문제가 생기면 keijiro의 **KinoGlitchURP**를 보라고 안내한다. 스크랩할
때는 없던 문장이다. 확인해보니 이 패키지가 서 있던 계보 전체가 그런 상태였고,
**끝에 공식판이 하나 생겨 있었다.**

## 목차

## 세 단계 포크의 계보

README가 직접 출처를 밝힌다 — mao-test-h의 프로젝트에 기반하고, 그건 다시
keijiro의 KinoGlitch에서 영감을 받았다고. 하나씩 열어보면 이렇다.

| 저장소 | 대상 | 라이선스 | 현재 상태 |
| --- | --- | --- | --- |
| `keijiro/KinoGlitch` | 레거시 파이프라인 | MIT | 원본 |
| `mao-test-h/URPGlitch` | Unity 2021.3+ / URP 12.1.7 | MIT | **"not actively maintained"** |
| `saimarei/URPGlitch` | Unity 6000.0 | MIT | **"will no longer be updating"** |
| `keijiro/KinoGlitchURP` | Unity 6000.0+ / URP | **Unlicense** | 공식 URP판 |

**중간 두 개가 둘 다 유지보수 중단을 명시한다.** mao-test-h 쪽 README에는
이렇게 적혀 있다.

> Please note that this project was implemented **for study purposes** and is
> not actively maintained.

포크가 이어진 이유가 여기 있다. 원본은 레거시 파이프라인용이었고, 공부 삼아
URP로 옮긴 것이 있었고, 그걸 Unity 6에 맞춰 다시 손본 것이 이 클리핑의
패키지다. **그리고 그 사이에 원저자가 URP판을 직접 냈다.** 그게 지금
`saimarei/URPGlitch`가 가리키는 곳이다.

## 어디에 왜 쓰나

패키지 README는 설치와 설정만 다룬다. 글리치 효과를 **언제 꺼내 쓰는지**는
적혀 있지 않으니 정리해둔다.

### 언제 쓰나

- **피격·경고 연출.** 플레이어가 맞았을 때 화면을 한순간 찢는다. 체력이
  낮을 때 상시로 약하게 깔아두는 쪽도 흔하다. UI로 알리는 것보다 몸에 먼저
  와닿는다.
- **장면 전환·시점 이동.** 순간이동, 해킹, 기억 회상처럼 "연결이 끊겼다가
  다시 붙는" 연출에 쓴다. 페이드보다 성격이 분명하다.
- **세계관 표현.** 사이버펑크, 호러, 레트로 CRT 감성. 이 경우엔 이벤트가
  아니라 **상시로 아주 약하게** 걸어두고 분위기를 만든다.

공통점은 셋 다 **강도를 시간에 따라 바꿔야 한다**는 것이다. 인스펙터에서 값
하나 올려두고 끝나는 효과가 아니라, 코드로 흔들었다 가라앉히는 쪽이 대부분이다.

### 코드로 제어하기

아래는 **공식판인 KinoGlitchURP** 기준이다. 카메라에 붙는 컨트롤러 컴포넌트를
직접 잡아 쓴다.

```csharp
using System.Collections;
using KinoGlitch;
using UnityEngine;

[RequireComponent(typeof(Camera))]
public class GlitchFeedback : MonoBehaviour
{
    private const float MIN_INTENSITY = 0f;

    [Header("Damage Flash")]
    [SerializeField, Range(0f, 1f), Tooltip("피격 순간의 최대 강도")]
    private float _peakIntensity = 0.6f;

    [SerializeField, Range(0.05f, 1f), Tooltip("가라앉는 데 걸리는 시간(초)")]
    private float _falloffSeconds = 0.35f;

    private DigitalGlitchController _digital;
    private Coroutine _running;

    private void Awake()
    {
        if (!TryGetComponent(out _digital))
        {
            _digital = gameObject.AddComponent<DigitalGlitchController>();
        }

        _digital.Intensity = MIN_INTENSITY;
    }

    public void PlayDamageFlash()
    {
        if (_running != null)
        {
            StopCoroutine(_running);
        }

        _running = StartCoroutine(FlashRoutine());
    }

    private IEnumerator FlashRoutine()
    {
        _digital.Intensity = _peakIntensity;

        float elapsed = 0f;
        while (elapsed < _falloffSeconds)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / _falloffSeconds;
            _digital.Intensity = Mathf.Lerp(_peakIntensity, MIN_INTENSITY, t);
            yield return null;
        }

        _digital.Intensity = MIN_INTENSITY;
        _running = null;
    }
}
```

아날로그 쪽은 파라미터가 다섯 개라 조합으로 성격이 갈린다. 체력이 낮을 때
상시로 깔아두는 형태라면 이렇게 된다.

```csharp
// 체력 비율(0~1)을 받아 낮을수록 화면이 흔들리게 한다
public void ApplyHealthDistortion(float healthRatio)
{
    float severity = Mathf.Clamp01(1f - healthRatio);

    _analog.ScanLineJitter    = severity * 0.35f;  // 주사선이 어긋난다
    _analog.VerticalJump      = severity * 0.10f;  // 화면이 세로로 튄다
    _analog.HorizontalShake   = severity * 0.15f;  // 가로로 떨린다
    _analog.ColorDrift        = severity * 0.30f;  // 색이 분리된다
    _analog.HorizontalRipple  = severity * 0.20f;  // 가로로 물결친다
}
```

다섯 개를 같은 비율로 올리면 대개 과해진다. **`ColorDrift`와
`ScanLineJitter`가 "화면이 고장났다"는 인상을 만들고**, `VerticalJump`는
값이 조금만 커도 눈이 피로해진다. 위 계수처럼 축마다 상한을 다르게 두는 편이
낫다.

### 성능에서 주의할 것

KinoGlitchURP README에 이 문장이 있다.

> **Digital Glitch still runs at zero Intensity** because it must keep updating
> its internal frame history. Disable the component if you want to eliminate its
> cost entirely.

**강도를 0으로 내려도 비용이 남는다.** 직전 프레임을 계속 들고 있어야 하는
구조라서 그렇다. 그래서 위 코routine도 마지막에 0을 넣고 끝나지만, 오래 안 쓸
거라면 컴포넌트 자체를 꺼야 한다.

```csharp
// 한동안 쓸 일이 없으면 컴포넌트를 끈다
_digital.enabled = false;
```

아날로그 쪽은 성격이 다르다. README가 "Analog Glitch **skips its pass** when
all properties are set to zero"라고 적는다. 전부 0이면 패스를 건너뛴다.
**둘의 0이 다르다**는 것만 알아두면 된다.

## 갈아타면 조작 방식이 바뀐다

공식판으로 옮기는 게 패키지 교체만으로 끝나지 않는다. **효과를 거는 구조가
다르다.**

| | 클리핑의 패키지 | KinoGlitchURP |
| --- | --- | --- |
| 조작 | Global Volume + 볼륨 오버라이드 | **카메라에 붙는 컨트롤러 컴포넌트** |
| 컴포넌트 이름 | Analog/Digital Glitch Volume | `AnalogGlitchController`, `DigitalGlitchController` |
| 기본 삽입 지점 | After Rendering Transparents (수동 지정) | **after post processing** (`Pass Event`로 변경) |
| 설치 | Git URL | **스코프드 레지스트리** |

클리핑 쪽은 URP의 볼륨 시스템을 탄다. 씬에 Global Volume을 만들고 프로파일에
오버라이드를 추가하는 방식이라, 구역별로 다른 값을 주거나 블렌딩하기에
유리하다.

공식판은 **카메라에 컴포넌트를 붙인다.** 위 예제 코드가 `TryGetComponent`로
바로 잡을 수 있는 이유가 이것이다. 볼륨을 거치지 않으니 코드에서 다루기는 더
단순한데, 볼륨 블렌딩으로 얻던 것은 직접 만들어야 한다.

**둘 중 뭐가 낫다기보다 쓰던 코드가 안 옮겨진다**는 게 요점이다. 볼륨
프로파일을 `TryGet`으로 뒤지던 코드는 전부 다시 써야 한다.

## 라이선스가 갈린다

계보 표에서 마지막 줄만 다르다. 원본 `KinoGlitch`와 그 포크들은 **MIT**인데,
공식 URP판 `KinoGlitchURP`는 **Unlicense**다.

클리핑의 README는 라이선스를 이렇게 적어뒀다.

> This project is released under the same license as
> [keijiro/KinoGlitch](https://github.com/keijiro/KinoGlitch).

원본을 찾아가야 알 수 있는 서술인데, 확인해보면 MIT가 맞고 GitHub이 저장소에
붙인 표기도 MIT다. **어긋나지는 않는다.** 다만 라이선스를 "다른 저장소를
보라"로 적어두면, 그 저장소가 나중에 라이선스를 바꿔도 이쪽은 모른다.
실제로 같은 저자의 새 저장소가 다른 라이선스를 달고 나왔다.

상업 프로젝트에 넣는다면 **어느 쪽을 쓰는지에 따라 고지 의무가 달라진다.**
MIT는 저작권 표시와 라이선스 전문을 함께 배포해야 하고, Unlicense는 퍼블릭
도메인에 가까워 그 의무가 없다.

## 설치 방법도 다르다

클리핑이 안내하는 방식은 Git URL이다. Package Manager에서 **+ → Install
package from Git URL**에 붙여 넣거나, `manifest.json`을 직접 고친다.

```json
{
  "dependencies": {
    "com.subbu.urp-glitch": "https://github.com/saimarei/URPGlitch.git",
    "com.unity.collab-proxy": "2.5.2"
  }
}
```

공식판은 스코프드 레지스트리를 쓴다.

> Install the KinoGlitch URP package (`jp.keijiro.kino-glitch.universal`) from
> the **'Keijiro' scoped registry** in Package Manager.

차이가 실무에서 드러나는 지점이 있다. **Git URL 방식은 버전을 고정하지
않는다.** 위 한 줄은 그 저장소의 기본 브랜치를 가리키므로, 저장소가 바뀌면
다음에 패키지를 복원할 때 다른 코드가 온다. 저장소가 사라지면 복원 자체가
안 된다. **유지보수가 끝났다고 선언된 저장소를 Git URL로 물고 있는 건 그
자체로 위험 요소**다.

태그를 붙여 고정할 수는 있지만(`.git#태그`), 스코프드 레지스트리 쪽이 버전
관리는 더 안정적이다.

## 클리핑에 남아 있는 것들

**셰이더를 손으로 지정하는 단계.** 설정 안내에 이런 줄이 있다.

> Set the **Shader** field by selecting an appropriate shader (click the eye
> icon to reveal hidden shaders).

렌더러 피처에 셰이더를 직접 물려야 한다는 뜻이다. 눈 아이콘을 눌러야 보이는
숨김 셰이더를 고르게 하는 구성이라, **빌드에서 셰이더가 빠지는 사고가 나기
쉬운 형태**다. 씬의 머티리얼이 참조하지 않는 셰이더는 스트리핑 대상이 되기
때문이다. 에디터에서 되던 게 빌드에서 안 나오면 여기를 먼저 본다.

**VR은 되돌려져 있다.** 저장소 커밋 목록에
`Revert "made texture usage to be compatible with vr"`가 남아 있다. VR에서
쓰려고 한 시도가 있었고 되돌려졌다는 뜻이다. XR 쪽에 붙일 생각이었다면 이
한 줄이 답이 된다.

**옛 버전은 Releases에 있다.** README 맨 위 안내다.

> If you are coming from the older URP Glitch video, you need to download the
> older `2021.3.8f1+` package from the **Releases** section.

Unity 6 이전 프로젝트라면 Git URL이 아니라 Releases에서 받아야 한다. Git URL
한 줄만 보고 붙였다가 컴파일이 깨지는 경우가 여기서 나온다.

## 정리

- 스크랩한 README에 지금은 **"I have moved on to using the Godot engine and
  will no longer be updating this repository"**가 붙어 있다.
- 계보가 넷이고 **중간 두 개가 둘 다 유지보수 중단을 명시한다.** mao-test-h
  쪽은 "for study purposes and is not actively maintained"다.
- 끝에 **공식 URP판 `KinoGlitchURP`**가 있다. Unity 6000.0+, 스코프드
  레지스트리 `jp.keijiro.kino-glitch.universal`.
- 글리치는 **강도를 시간에 따라 흔드는** 효과라 코드 제어가 기본이다. 피격
  연출, 장면 전환, 상시 분위기 셋이 주된 자리다.
- **Digital Glitch는 강도가 0이어도 비용이 남는다.** 프레임 히스토리를 계속
  갱신하기 때문이고, 완전히 없애려면 컴포넌트를 꺼야 한다. Analog은 전부 0이면
  패스를 건너뛴다.
- **갈아타면 조작 구조가 바뀐다.** 볼륨 오버라이드 → 카메라 컨트롤러. 볼륨을
  뒤지던 코드는 다시 써야 한다.
- **라이선스가 갈린다.** 포크들은 MIT, 공식 URP판은 Unlicense다. 고지 의무가
  다르다.
- Git URL 설치는 **버전을 고정하지 않는다.** 유지보수가 끝난 저장소를 기본
  브랜치로 물고 있는 건 그 자체로 위험이다.

저장소 README를 스크랩하는 건 값이 있다. 설치 명령과 설정 순서가 한자리에
있으니까. 다만 **README는 저장소의 현재 상태를 반영하는 문서**라, 스크랩하는
순간 그 관계가 끊긴다. 이번 건은 그 사이에 **저자가 문을 닫았고, 원저자가 문을
열었다.**

그래서 패키지 클리핑에서 먼저 볼 것이 정해졌다. 설치 명령이 아니라 **README
맨 위와 마지막 커밋 날짜**다. 둘 중 하나만 봐도 그 아래를 읽을지가 정해진다.

연출 하나 넣으려고 시작한 일인데 결론이 패키지 선택으로 끝난 게 좀 얄궂다.
다만 글리치는 **이벤트에 맞춰 강도를 흔드는 효과**라 코드에서 계속 건드리게
되고, 그러면 그 API가 앞으로도 그대로일지가 실제 문제가 된다. 지금 화면에
어떻게 보이느냐만큼 **누가 고치고 있느냐**가 고를 기준이 되는 종류였다.

## 참고

- [saimarei/URPGlitch](https://github.com/saimarei/URPGlitch)
- [keijiro/KinoGlitchURP](https://github.com/keijiro/KinoGlitchURP)
- [mao-test-h/URPGlitch](https://github.com/mao-test-h/URPGlitch)
- [keijiro/KinoGlitch](https://github.com/keijiro/KinoGlitch)
