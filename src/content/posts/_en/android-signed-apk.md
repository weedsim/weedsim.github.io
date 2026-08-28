---
pubDatetime: 2026-08-28T12:00:00+09:00
title: "Building a Signed APK: The Real Output Isn't the APK, It's the Keystore"
lang: en
translationKey: android-signed-apk
featured: false
draft: false
tags:
  - Android
  - Android Studio
  - App Signing
  - Keystore
  - Gradle
  - Unity
description: "Notes from trying to build an open-source app myself. The Generate Signed Bundle/APK flow in Android Studio, where the keystore it creates should actually live, and what Play's AAB requirement and Play App Signing changed."
---

I was about to use an Android app whose source is public. I could have just
installed it from the Play Store, but nothing about that download by itself
guarantees the binary matches the published source. I wanted to read the code
and do my own security check, so I decided to build it locally — and the
material behind this post is what I had clipped about producing an APK.

The thing is, an APK you build yourself cannot overwrite the one from the
store. Even with the same package name, **Android will not treat it as an
update if the signing key differs**. `adb install` fails with
`INSTALL_FAILED_UPDATE_INCOMPATIBLE`, and it only installs after you uninstall
the existing app. Verifying software by building it yourself means, in
practice, creating a second, separate app signed with your own key.

That makes signing the main subject here rather than a side detail. The
procedure itself is a few wizard screens, and searching turns up plenty of
screenshot walkthroughs — but most of them leave out the same thing. What
actually matters in this wizard is not the APK that drops out at the end, but
the **keystore** you create almost in passing along the way. You can always
rebuild an APK. Lose the keystore and it's over.

## Table of contents

## The procedure itself is short

In Android Studio the flow is:

1. From the menu bar, **Build > Generate Signed Bundle/APK**
2. Choose **APK** or **Android App Bundle**
3. Pick a key. First time round, **Create new...**
4. Enter the keystore path, keystore password, key alias, key password,
   validity period, and the name fields that go into the certificate
5. Select the **release** build variant and click **Create**
6. When the build finishes, click **locate** in the notification to jump to
   the output

The menu name matches the official docs. From
[App signing](https://developer.android.com/studio/publish/app-signing):

> In the menu bar, click **Build > Generate Signed Bundle/APK**.

That's the click order. The problem is step 4: if you go through it without
knowing what you're entering, there's no way back later.

## What a keystore and a key actually are

The terminology stacks two layers, which is easy to conflate.

- **Keystore** — a single binary file (`.jks`, `.keystore`) holding private
  keys and public key certificates. The safe.
- **Key / alias** — an individual key inside the keystore. A compartment
  inside the safe. One keystore can hold several, which is why they need
  aliases.

That's also why you're asked for two passwords. The **keystore password**
opens the safe; the **key password** opens one compartment inside it. You can
set them to the same value, but they are conceptually different.

Where the original post says to fill in `First and Last Name` "for
authentication," those fields are the X.500 subject of the certificate.
`First and Last Name` is the CN (Common Name), and the fields below it —
Organizational Unit, Organization, City, State, Country Code — are OU, O, L,
ST and C. Because this is a self-signed certificate there is no issuing
authority, so whatever you type here *is* the stated identity of whoever
signed the app. The build works with only the CN filled in, as the original
says, but for anything you intend to distribute it's better to enter values
you'll recognise as your own when you later print the certificate with
`apksigner`.

## The real output of this procedure is the keystore

### Lose it and it's over

This is the point the official docs state most forcefully.

> Your private key is required for signing all future versions of your app.
> If you lose or misplace your key, you will not be able to publish updates
> to your existing app. You cannot regenerate a previously generated key.

Android only accepts an APK as an update to an existing app if it has **the
same package name and the same signing key**. A different key means a
completely different app, not an update, and it cannot be installed over the
existing version on a device. The user has to uninstall and reinstall, which
wipes the app's data. For an app published on a store, you simply can't ship
the update at all.

So the single `.jks` file this wizard produces holds the entire lifespan of
the app. Even for a personal project, it's worth deciding on a backup
location the first time you create it.

### Validity period

It's easy to skip past this field, but there is a standard.

> Your key should be valid for at least 25 years, so you can sign app updates
> with the same key through the lifespan of your app.

If you plan to ship on Google Play, one more condition applies.

> If you plan to publish your apps on Google Play, the key you use to sign
> your app must have a validity period ending after 22 October 2033.

Twenty-five years sounds generous, but you cannot extend it later. Once it
expires you can no longer distribute updates signed with that key.

### The debug keystore can't be used for release

Apps install on a device when you just hit Run in the IDE because a signature
is already being applied — a debug certificate.

> The first time you run or debug your project in Android Studio, the IDE
> automatically creates the debug keystore and certificate in
> `$HOME/.android/debug.keystore`, and sets the keystore and key passwords.

That certificate can't be used for distribution.

> Because the debug certificate is created by the build tools and is insecure
> by design, most app stores (including the Google Play Store) do not accept
> apps signed with a debug certificate for publishing.

Its password is a published constant, so anyone can sign with the same key.
That's the reason for creating a separate release keystore.

## One thing in the original that gives me pause

The [original post](https://jindevelopetravel0919.tistory.com/374) this is
based on gives this advice on the screen where you choose where to save the
keystore.

> 웬만하면 현재 진행 중인 프로젝트 폴더를 선택해주는 것이 좋습니다.
>
> (Generally it's best to select the folder of the project you're currently
> working on.)

It's understandable in terms of finding the file again, but **if the project
is under git this is a dangerous default.** Create a `.jks` in the project
root and the next `git add` commits your signing key. On a public repository
the key is leaked the moment that happens, and deleting the file later leaves
it in the commit history.

The official docs point the other way.

> Keep the keystore file containing your private key in a safe, secure place.

> If you are working with a team or open-sourcing your code, you should move
> this sensitive information out of the build files so it is not easily
> accessible to others.

> Be sure to keep the `keystore.properties` file secure. This may include
> removing it from your source control system.

Rather than the original being "wrong," this reads like advice written for a
personal exercise without version control that then stayed as-is.

### The axis isn't inside vs outside — it's what the repository is

Does putting it outside the project folder solve it, then? No. Compare "keep
it in the project folder but `.gitignore` it" against "keep it outside the
project folder" from a backup standpoint and there is **no difference.**
Neither ends up in version control, so backup has to be solved by some other
means either way.

So inside-vs-outside isn't the criterion. What you actually have to separate
is **whether this repository is public or shared.**

### A private, solo repository, when backup is the goal

For a private repository you're the only one working in, committing the
keystore and using the repo as its backup can be a practical choice. A copy
lives on the remote, history comes along with it, and it serves the purpose.
Three conditions come attached, though.

- **Don't commit the passwords with it.** A `.jks` is a password-protected
  file. The file alone being in the repo and `keystore.properties` being in
  there with it are completely different risk levels — the latter removes the
  protection entirely.
- **That file's only defence is its password.** If the repository leaks by any
  route, what's left is a password-guessing problem, so the format and the
  password strength *are* the defence. For reference, `keytool` warns that the
  older JKS format is a proprietary format and recommends migrating to PKCS12;
  since JDK 9 the default format is PKCS12 anyway.
- **A repository's visibility can change later.** Flipping it public, a fork,
  a transfer to an organisation, adding a collaborator — any one of those and
  the key already in the history goes along with it. Deleting the file leaves
  it in past commits, and since a signing key cannot be revoked and reissued,
  there is effectively no way back. So this is a choice you make when you're
  confident not that it's *private now*, but that **it will never be made
  public.**

### When the repository is public or shared

For open source or a team repository, a `.gitignore` rule is the baseline.
Two more things need attention here.

- **The path is exposed too, not just the passwords.** Hard-code `storeFile`
  as an absolute path in `build.gradle` and your username and directory
  structure are published along with it. Not fatal on its own, but it tells
  anyone reading the repo what to look for and where. That's exactly why the
  path and the passwords both get pulled out into `keystore.properties` or
  environment variables, leaving only the key names in the build script.
- **Stay conscious of the routes an accidental commit takes.** `.gitignore` is
  a rule, not an enforcement. `git add -f`, a commit that mangles
  `.gitignore`, another clone without that rule, a deploy or archive script
  that doesn't honour ignore rules — any of these will get it in. And once
  it's in, as above, deleting the file leaves it in the history.

There's an accident in the opposite direction as well: `git clean -fdx`
deletes ignored files too, so if it lives inside the project folder and you
haven't backed it up separately, that single command loses you the key.

### Outside the project folder is a solo choice

Being outside the working tree means there's no path by which it can be
committed and `git clean` can't touch it. But the path differs per machine, so
it can't be shared as-is — which makes this **the option you pick when you're
working alone.** On a team you end up going through a secrets manager or the
CI provider's secret store with only the build server pulling the key out
anyway, and at that point "where on my PC do I keep it" stops being a
question at all.

Unity's documentation describes the same trade-off from the other side, and
that sentence also shows why this is easy to get backwards. Explaining the
option of putting the keystore in a dedicated location, it says:

> However, as the dedicated location is outside the Project folder, the
> keystore file isn't tracked by version control, and hence not accessible
> for collaboration.

"Outside the project folder it isn't tracked, and therefore isn't available
for collaboration" is a sentence that presupposes **inside the project folder
it does get tracked**. So the "collaboration" on offer here is precisely "the
signing key goes into the repository." Held against the criterion above, that
only holds conditionally, and only for a private solo repository — but a
situation you'd call "collaboration" is by definition one where the repository
is shared, and there a `.gitignore` rule is required. The moment you add it,
the advantage Unity is describing disappears and only the choice of location
remains.
([Create a new keystore](https://docs.unity3d.com/Manual/android-keystore-create.html))

So `.gitignore` splits by what the repository is.

```gitignore
# Passwords and path — always excluded, whatever the repository is
keystore.properties

# The keystore itself — exclude if the repository is public or shared
*.jks
*.keystore
```

## APK or AAB?

The wizard's second screen asks you to choose between APK and Android App
Bundle. The original, written in 2024, chose APK. Today the answer depends on
the destination.

> From August 2021, new apps are required to publish with the Android App
> Bundle on Google Play.

If you're publishing a **new app** on Google Play, you can't upload an APK.
You upload an AAB and Play generates and serves the optimised APKs per device
configuration.

> Google Play uses your app bundle to generate and serve optimized APKs for
> each device configuration, so only the code and resources that are needed
> for a specific device are downloaded to run your app.

That doesn't mean APKs are dead. An AAB is a publishing format, not an
installation format — what actually installs on a device is still an APK, and
building one directly is the right call for:

- Installing by handing the file to a phone directly (sideloading)
- QA builds, internal distribution, sending a file to testers
- Stores other than Play, or your own distribution channel

The scenario the original covers — extract an APK, put it on a phone, install
it — falls squarely into this group, so it still holds up. The only thing to
separate out is that this procedure is not the same as a Play release
procedure.

## Play App Signing: upload key vs app signing key

If you do publish on Play, one more key enters the picture. Under Play App
Signing there are two kinds.

- **App signing key** — the key actually applied to the APKs installed on
  users' devices. Play holds it.
- **Upload key** — the key you use to sign the AAB or APK when uploading it
  to Play.

What this distinction really changes is what happens when you lose a key.

> When you use Play App Signing, if you lose your upload key, or if it is
> compromised, you can request an upload key reset in the Play Console.
> Because your app signing key is secured by Google, you can continue to
> upload new versions of your app as updates to the original app, even if you
> change upload keys.

The other case remains unrecoverable.

> By comparison, for apps that have not opted in to Play App Signing, if you
> lose your app's signing key, you lose the ability to update your app.

So Play App Signing softens the "lose it and it's over" rule, but only for the
upload key. An app distributed outside Play has no such safety net, which
means keystore management is entirely on you.

## You don't have to click through the wizard every time

After a few releases, clicking through this wizard gets old fast. Put the
signing configuration in Gradle and `Build > Build Bundle(s) / APK(s)` alone
produces a signed artifact.

You must not write passwords directly into the build script, so the approach
the official docs recommend is pulling the values into a separate file.
Create `keystore.properties` in the project root:

```properties
storePassword=myStorePassword
keyPassword=mykeyPassword
keyAlias=myKeyAlias
storeFile=myStoreFileLocation
```

Then read it from `build.gradle.kts`:

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

Now `build.gradle.kts` is safe to commit and only `keystore.properties` needs
to be in `.gitignore` — already included in the example above.

## Checking that the signature is what you think it is

A successful build is no guarantee it was signed with the key you intended.
Shipping something signed with a debug key without noticing is a common
mistake. [`apksigner`](https://developer.android.com/tools/apksigner), which
ships with the SDK Build Tools, will tell you.

```bash
# <SDK>/build-tools/<version>/apksigner
apksigner verify --print-certs app-release.apk
```

It prints the certificate subject and its SHA-256 fingerprint. If it was
signed with a debug key you'll see `CN=Android Debug`.

To inspect the keystore itself, use the JDK's `keytool`.

```bash
keytool -list -v -keystore my-release-key.jks -alias my-alias
```

That lists the aliases, certificate fingerprints and the validity period —
which is where you check the 2033 condition mentioned earlier.

## Where this lives in Unity

The same concepts apply when building for Android from Unity. Only the
location differs.

Keystore settings live under **Edit > Project Settings > Player > Android >
Publishing Settings**, where you open the **Keystore Manager** window.
([Keystore Manager window reference](https://docs.unity3d.com/Manual/android-keystore-manager.html))

- You create a new keystore or load an existing one.
- Adding a key takes an alias, passwords and **Validity (years)** — Unity's
  default is 50 years.
- The name fields (First and Last Name, Organization, City, State, Country
  Code) are the same X.500 fields as in the Android Studio wizard.

A few things to watch.

- **If you configure nothing, Unity signs with a debug key too.** Fine during
  development, not something to ship.
- For the save location you choose between the project folder (**Anywhere**)
  and **In Dedicated Location**. The criterion set out above applies as-is. If
  the project is public or shared with a team, a `.gitignore` rule has to come
  with it — and at that point the "collaboration" benefit Unity's docs
  describe is gone. The dedicated location is the pick for working alone.
- For Google Play, enable **Build App Bundle (Google Play)** in Build Settings
  to produce an AAB. For sideloading, leave it off and build an APK.

## Summary

- An APK you build yourself cannot overwrite one installed from a store. A
  different signing key means a separate app, same package name or not.
- The irreversible thing this wizard produces is the keystore, not the APK.
- Lose the key and you can never ship an update to that app again. Validity:
  at least 25 years, and past 22 October 2033 for Play.
- The criterion isn't inside vs outside the project folder, it's whether the
  repository is public or shared. For a private solo repository, committing it
  as a backup is a legitimate option — but the passwords stay out, and you
  have to account for visibility changing later. For a public or shared
  repository a `.gitignore` rule is the baseline, and the keystore path is
  exposed too, not just the passwords. Outside the project folder is the pick
  for working alone.
- New apps on Play have required AAB since August 2021. APKs are still what
  you use for sideloading, QA and self-distribution.
- With Play App Signing a lost upload key can be reset. Google holds the app
  signing key.
- Automate repeat builds with `keystore.properties` + `signingConfigs`, and
  verify the result with `apksigner verify --print-certs`.
- Unity works the same way conceptually: Keystore Manager under Publishing
  Settings, and remember that the default is a debug key.

## References

- [Sign your app — Android Developers](https://developer.android.com/studio/publish/app-signing)
- [About Android App Bundles — Android Developers](https://developer.android.com/guide/app-bundle)
- [apksigner — Android Developers](https://developer.android.com/tools/apksigner)
- [Keystore Manager window reference — Unity](https://docs.unity3d.com/Manual/android-keystore-manager.html)
- [Create a new keystore — Unity](https://docs.unity3d.com/Manual/android-keystore-create.html)
- Original post (Korean): [\[Android Studio\] 안드로이드 스튜디오 APK 추출](https://jindevelopetravel0919.tistory.com/374)
