---
pubDatetime: 2026-09-04T17:00:00+09:00
title: "Git LFS 추적 해제하기: `git lfs uninstall`은 기본이 전역이다"
lang: ko
translationKey: git-lfs-untrack
featured: false
draft: false
tags:
  - Git
  - Git LFS
  - 버전 관리
  - GitHub
description: "LFS 추적을 해제하고 GitHub 저장공간을 되찾는 절차를 정리한 2021년 글을 지금 기준으로 다시 봤다. 명령어 세 개의 설명이 실제 동작과 다르고, GitHub의 LFS 정책도 그 사이에 바뀌었다."
---

Unity 프로젝트를 굴리다가 GitHub의 LFS 용량을 넘겼다. 원인을 찾아보니 LFS
자체가 문제가 아니라 **굳이 LFS로 잡을 필요가 없는 것까지 잡아둔 것**이
문제였다. 그래서 그걸 빼내는 방법을 찾다가, Git LFS 추적을 해제하고 GitHub의
저장공간을 되찾는 절차를 정리한
[글](https://blog.syki66.com/2021/04/09/git-lfs-untrack/)을 스크랩해뒀었다.
명령어만 짧게 나열한 형태라 급할 때 보기 좋다.

그런데 대조해보니 **명령어 세 개의 설명이 실제 동작과 다르고**, 그중 하나는
그대로 실행하면 **다른 저장소들까지 망가진다.** 게다가 2021년 글이라 GitHub의
LFS 정책이 그 사이에 꽤 바뀌었다. 순서대로 정리한다.

## 목차

## 원문이 제시하는 순서

원문의 흐름은 이렇다.

1. `git lfs ls-files --all` — 모든 커밋에서 LFS로 관리되는 파일 확인
2. **현재 커밋에서 해제** — `git lfs untrack` → `git rm --cached` → `git add`
3. **모든 커밋에서 해제** — `git lfs migrate export` → `git lfs uninstall` →
   `git filter-branch`로 `.gitattributes` 제거
4. `git filter-branch --env-filter`로 커밋 날짜 보정
5. GitHub 저장공간 회수 — 레포지토리 삭제 후 재생성

큰 얼개는 맞다. `git lfs migrate export`가 히스토리 전체를 되돌리는 정공법인
것도 맞고, 5번의 지적 — **추적을 해제해도 LFS 저장공간은 그대로 남는다** — 은
지금도 유효한 함정이다.

문제는 개별 명령어의 설명이다.

## `git rm --cached`는 원격 저장소를 건드리지 않는다

원문은 이 명령어에 이런 설명을 붙였다.

> 원격저장소에서 `.ext` 확장자를 가진 파일들 삭제
>
> ```
> git rm --cached '*.ext'
> ```

**원격 저장소와는 아무 관계가 없다.** Git 문서의 정의는 이렇다.

> Use this option to unstage and remove paths only from the index. Working tree
> files, whether modified or not, will be left alone.

`git rm` 자체가 로컬 인덱스와 작업 트리만 다룬다.

> Remove files matching pathspec from the index, or from the working tree and
> the index.

`--cached`를 붙이면 **인덱스에서만 빼고 디스크의 파일은 그대로 둔다.** 이
단계의 진짜 목적은 파일을 지우는 게 아니라, LFS 필터를 거쳐 스테이징돼 있던
항목을 인덱스에서 한 번 내리는 것이다. 그래야 다음 줄의 `git add`가 이번에는
LFS 없이 **일반 blob으로** 다시 올린다.

즉 세 줄의 의미는 이렇다.

```bash
git lfs untrack '*.ext'   # .gitattributes에서 규칙 제거
git rm --cached '*.ext'   # 인덱스에서 내림 (파일은 그대로)
git add '*.ext'           # 일반 파일로 다시 스테이징
```

설명을 "원격에서 삭제"로 읽으면 이 흐름이 이해가 안 되고, 더 나쁘게는
`--cached`를 빼고 실행할 위험이 생긴다. 그러면 진짜로 파일이 지워진다.

## `git lfs uninstall`은 기본이 전역이다

이게 이 글에서 가장 위험한 줄이다. 원문은 이렇게만 적었다.

> `lfs hook` 제거
>
> ```
> git lfs uninstall
> ```

Git LFS 매뉴얼의 설명은 이렇다.

> Remove the 'lfs' clean and smudge filters from the global Git config.
> Uninstall the Git LFS pre-push hook if run inside a Git repository.

**기본 동작이 전역(`~/.gitconfig`) 설정을 건드린다.** 이 저장소 하나를
정리하려고 친 명령어가, 이 PC에서 LFS를 쓰는 **다른 모든 저장소의 필터를
같이 떼어낸다.**

증상이 바로 안 나타나서 더 성가시다. 이미 클론된 저장소는 당장 멀쩡해 보이고,
나중에 새로 클론하거나 체크아웃할 때 큰 파일 대신 **포인터 텍스트 파일**이
내려온다. `version https://git-lfs.github.com/spec/v1` 로 시작하는 몇 줄짜리
텍스트다. Unity 프로젝트라면 텍스처와 모델이 전부 이 꼴이 되고, 에디터는
임포트 에러를 뱉는다.

저장소 하나만 정리하려면 범위를 명시해야 한다.

```bash
git lfs uninstall --local
```

> Removes the 'lfs' smudge and clean filters from the local repository's git
> config, instead of the global git config.

반대로 전역 설정만 정리하고 현재 저장소는 그대로 두고 싶다면 `--skip-repo`가
있다. **플래그 없이 치는 건 거의 항상 의도한 동작이 아니다.**

## `filter-branch`는 git이 직접 쓰지 말라고 한다

원문은 `.gitattributes`를 히스토리에서 지우는 데, 그리고 커밋 날짜를 보정하는
데 `git filter-branch`를 쓴다. 2021년에는 흔한 선택이었지만 지금은 아니다.
Git 공식 문서의 경고문을 그대로 옮긴다.

> *git filter-branch* has a plethora of pitfalls that can produce non-obvious
> manglings of the intended history rewrite (and can leave you with little time
> to investigate such problems since it has such abysmal performance). These
> safety and performance issues cannot be backward compatibly fixed and as
> such, its use is not recommended. Please use an alternative history filtering
> tool such as git filter-repo.

"권장하지 않는다"가 아니라 **"안전성과 성능 문제를 호환성을 지키면서 고칠 수
없어서 권장하지 않는다"**는 서술이다. 대안으로 `git filter-repo`를 이름까지
찍어 지목한다.

### 그리고 그 단계가 꼭 필요하지도 않다

한 가지 더. `git lfs migrate export`는 이미 `.gitattributes`를 손댄다.

> The export command will modify the `.gitattributes` to set/unset any filepath
> patterns as given by those flags.

다만 항목을 지우는 게 아니라 "추적하지 말라"는 항목을 **넣는다.**

> instead, the `export` mode inserts 'do not track' entries similar to those
> created by the `git lfs untrack` command.

그러니까 원문의 `filter-branch` 단계는 **LFS 해제에 필요한 작업이 아니라,
`.gitattributes` 파일 자체를 히스토리에서 지우고 싶을 때의 별도 청소**다.
LFS만 벗기는 게 목적이라면 안 해도 된다. 굳이 하겠다면 `filter-repo`로.

## 히스토리를 다시 쓴다는 것의 무게

원문에는 `git push origin +브랜치이름`이 담담하게 한 줄 적혀 있다. 앞의 `+`가
강제 푸시다. 이게 무슨 뜻인지는 적혀 있지 않다.

`git lfs migrate` 문서는 이 점을 명시한다.

> This will require a force-push to any existing Git remotes

히스토리를 다시 쓰면 모든 커밋의 해시가 바뀐다. 결과는 이렇다.

- **기존 클론은 전부 어긋난다.** 협업자들은 `git pull`로 따라올 수 없고,
  다시 클론하거나 로컬 브랜치를 버리고 리셋해야 한다.
- **열려 있는 PR이 깨진다.** 브랜치의 기반 커밋이 사라지기 때문이다.
- **되돌리기 어렵다.** 강제 푸시 전에 원격의 상태를 어딘가에 백업해두는 게
  안전하다.

혼자 쓰는 저장소가 아니라면, 명령어를 치기 전에 **언제 할 것인지 팀에 알리고
그 시점에 아무도 작업 중이지 않게 맞추는 것**이 실제로 가장 중요한 단계다.
원문의 4번(커밋 날짜 보정)이 존재하는 이유도 여기 있다. 히스토리를 다시 쓰면
커미터 날짜가 전부 오늘로 바뀌어서, GitHub 기여 그래프가 하루에 몰린다.

## GitHub의 LFS 용량은 그때와 다르다

2021년 글이라 이 부분이 가장 많이 바뀌었다. 현재 GitHub 문서 기준이다.

- **Free·Pro** — 저장공간과 대역폭 각각 **10 GiB**
- **Team·Enterprise Cloud** — 각각 **250 GiB**
- **데이터 팩은 없어졌다.** "Git LFS billing used pre-paid data packs. These
  have been removed and replaced with metered billing and you only pay for what
  you actually use."
- **예산을 $0으로 두면** 초과 요금은 안 나가는 대신 "Git LFS usage is blocked
  for the rest of the calendar month" — 그 달 남은 기간 LFS 사용이 막힌다.

그리고 게임 프로젝트에서 실제로 먼저 걸리는 건 저장공간이 아니라 대역폭인
경우가 많은데, 과금 주체를 알아둘 만하다.

> When you **download** a Git LFS file, the bandwidth you use is included in the
> **repository owner's bandwidth usage**.

**남이 내 저장소를 클론할 때 쓰는 대역폭이 내 계정에 붙는다.** 에셋이 큰 Unity
프로젝트를 공개 저장소로 올려두고 사람이 몰리면, 내가 아무것도 안 해도 한도가
소진된다.

## 저장공간 회수: 레포 삭제만이 답은 아니다

원문의 결론이다.

> 현재로서 유일하게 저장공간을 비울 수 있는 방법은 깃허브에서 `레포지토리를
> 삭제하고 다시 생성` 하는 방법 밖에 없다.

핵심 지적은 지금도 맞다. GitHub 문서는 이렇게 적는다.

> After you remove files from Git LFS, the Git LFS objects still exist on the
> remote storage and will continue to count toward your Git LFS storage quota.

> To remove Git LFS objects from a repository, delete and recreate the
> repository.

이슈·스타·포크가 함께 사라진다는 경고도 문서에 있다. 다만 "유일한 방법"은
이제 아니다. 같은 문서가 예외 경로를 하나 덧붙인다.

> If you need to purge a removed object and you are unable to delete the
> repository, please contact support for help.

저장소를 지울 수 없는 사정이 있다면 **지원팀 문의**라는 길이 있다. 이슈와
스타가 쌓인 저장소라면 삭제 전에 이쪽을 먼저 시도해볼 값이 있다.

## 애초에 무엇을 LFS로 잡아야 했나

내 경우 용량을 넘긴 원인은 LFS 자체가 아니라 **잡을 필요 없는 것까지 잡아둔
것**이었다. 그래서 해제 절차보다 이 기준이 먼저다.

LFS가 해결하는 문제는 하나다. **큰 바이너리 파일은 조금만 바뀌어도 전체가 새
객체로 저장되고 diff와 병합이 안 된다.** 그래서 히스토리가 계속 부풀어 오른다.
LFS는 그런 파일의 실체를 밖에 두고 저장소에는 포인터만 남긴다.

뒤집어 말하면 **텍스트 파일을 LFS로 잡으면 손해만 본다.** git이 원래 잘하던
델타 압축과 diff·병합을 포기하면서 용량은 용량대로 쓰는 것이다.

Unity 프로젝트에서 이 실수가 나오기 쉬운 이유는, 확장자만 보면 바이너리처럼
보이는 텍스트 파일이 많기 때문이다.

**LFS로 잡지 말아야 하는 것**

- `.meta` — 몇 줄짜리 텍스트인데 파일 수가 수천 개다. 개수가 많아서 LFS로
  넘기면 용량보다 요청 수 쪽이 먼저 문제가 된다.
- `.unity`, `.prefab`, `.asset`, `.mat`, `.controller` — Asset Serialization을
  Force Text로 두면 전부 YAML 텍스트다. LFS로 잡으면 **씬과 프리팹 병합이 아예
  불가능해진다.**
- `.cs`, `.shader`, `.json`, `.txt`, `.md`, `.csproj`

**LFS가 실제로 필요한 것**

- 이미지 원본 — `.psd`, `.tga`, 큰 `.png`
- 모델과 애니메이션 — `.fbx`, `.blend`
- 오디오·비디오 — `.wav`, `.mp3`, `.ogg`, `.mp4`
- 바이너리 산출물 — `.dll`, `.so`, `.aar`, `.unitypackage`

무엇이 실제로 용량을 먹고 있는지는 명령어로 확인할 수 있다.

```bash
git lfs ls-files --all --size
```

`--size`는 "Show the size of the LFS object between parenthesis at the end of a
line"이고, `--all`은 이렇게 설명된다.

> Inspects the full history of the repository, not the current HEAD (or other
> provided reference). This will include previous versions of LFS objects that
> are no longer found in the current tree.

**현재 트리에 없는 과거 버전까지 포함**해서 보여주므로, "지금은 지웠는데 용량은
그대로"인 상황의 원인을 여기서 찾을 수 있다.

## 그래서 지금 순서는 이렇게 된다

정리하면 이렇다.

```bash
# 0. 현황 확인. 무엇이 LFS로 관리되는지 먼저 본다
git lfs ls-files --all

# 0-1. 백업. 히스토리를 다시 쓰기 전에 원격 상태를 어딘가에 남긴다
git clone --mirror <remote> backup.git

# 1. 히스토리 전체에서 LFS 해제 (.gitattributes도 함께 갱신된다)
git lfs migrate export --everything --include='*.ext'

# 2. 이 저장소에서만 LFS 필터 제거 — --local을 반드시 붙인다
git lfs uninstall --local

# 3. 강제 푸시. 팀에 미리 공지하고, 아무도 작업 중이 아닐 때
git push origin --force --all
git push origin --force --tags

# 4. GitHub 저장공간 회수는 별도 작업
#    - 레포 삭제 후 재생성, 또는 지원팀 문의
```

`.gitattributes` 파일 자체를 히스토리에서 지우고 싶다면 그때
`git filter-repo`를 쓴다. `filter-branch`는 쓰지 않는다.

## 정리

- `git rm --cached`는 **인덱스에서만** 내린다. 원격 저장소와 무관하고, 디스크의
  파일도 그대로다.
- `git lfs uninstall`은 **기본이 전역 설정**이다. 저장소 하나만 정리하려면
  `--local`을 붙여야 한다. 안 붙이면 이 PC의 다른 LFS 저장소들이 포인터 파일을
  내려받게 된다.
- `git filter-branch`는 Git 공식 문서가 사용을 권장하지 않으며 `git filter-repo`를
  대안으로 지목한다.
- `git lfs migrate export`가 이미 `.gitattributes`를 갱신한다. 원문의
  `filter-branch` 단계는 LFS 해제에 필요한 작업이 아니다.
- 히스토리 재작성은 강제 푸시를 요구하고 기존 클론과 PR을 깬다. 명령어보다
  **팀 조율과 백업**이 먼저다.
- GitHub LFS는 Free·Pro 기준 저장공간·대역폭 각 **10 GiB**로 늘었고, 데이터
  팩은 폐지되고 종량제가 됐다. 대역폭은 **다운로드하는 쪽이 아니라 저장소
  소유자**에게 붙는다.
- 추적을 해제해도 LFS 저장공간은 남는다는 원문의 지적은 유효하다. 다만 레포
  삭제 외에 **지원팀 문의**라는 경로가 문서에 추가됐다.
- 애초에 **텍스트 파일을 LFS로 잡으면 손해만 본다.** Unity에서는 `.meta`와
  Force Text로 직렬화된 `.unity`·`.prefab`이 대표적인 오분류이고, 후자는
  병합까지 막는다.
- 무엇이 용량을 먹는지는 `git lfs ls-files --all --size`로 본다. 현재 트리에
  없는 과거 버전까지 포함해서 보여준다.

## 참고

- [git rm — Git Docs](https://git-scm.com/docs/git-rm)
- [git filter-branch — Git Docs](https://git-scm.com/docs/git-filter-branch)
- [git-filter-repo](https://github.com/newren/git-filter-repo/)
- [git lfs ls-files — Git LFS](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-ls-files.adoc)
- [git lfs migrate — Git LFS](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-migrate.adoc)
- [git lfs uninstall — Git LFS](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-uninstall.adoc)
- [Removing files from Git Large File Storage — GitHub Docs](https://docs.github.com/en/repositories/working-with-files/managing-large-files/removing-files-from-git-large-file-storage)
- [About billing for Git LFS — GitHub Docs](https://docs.github.com/en/billing/concepts/product-billing/git-lfs)
- 원문: [\[git lfs untrack\] 깃, lfs 추적 해제, 원격 저장소 lfs 저장공간 확보](https://blog.syki66.com/2021/04/09/git-lfs-untrack/)
