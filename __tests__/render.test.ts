import * as render from '../src/render'
import {PROJECT} from './mocks.test'

describe('Render', function () {
  describe('getTitle', function () {
    it('title is not present', function () {
      const title = render.getTitle(undefined)
      expect(title).toEqual('')
    })

    it('title is empty', function () {
      const title = render.getTitle('')
      expect(title).toEqual('')
    })

    it('title with blank space', function () {
      const title = render.getTitle(' ')
      expect(title).toEqual('')
    })

    it('title does not start with #', function () {
      const title = render.getTitle('Coverage Report')
      expect(title).toEqual('### Coverage Report\n')
    })

    it('title does not start with # with empty space at beginning and end', function () {
      const title = render.getTitle(' Coverage Report ')
      expect(title).toEqual('### Coverage Report\n')
    })

    it('title starts with #', function () {
      const title = render.getTitle('# Coverage Report')
      expect(title).toEqual('# Coverage Report\n')
    })

    it('title with back-ticks', function () {
      const title = render.getTitle('# `Coverage Report`')
      expect(title).toEqual('# `Coverage Report`\n')
    })

    it('title starts with # with empty space at beginning and end', function () {
      const title = render.getTitle(' # Coverage Report ')
      expect(title).toEqual('# Coverage Report\n')
    })
  })

  describe('get PR Comment', function () {
    const emoji = {
      pass: ':green_apple:',
      fail: ':x:',
    }
    describe('no modules', function () {
      const project = {
        ...PROJECT.SINGLE_MODULE,
        modules: [],
        'coverage-changed-files': 100,
        changed: {
          covered: 0,
          missed: 0,
          percentage: undefined,
        },
      }
      it('coverage greater than min coverage', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 30,
            changed: 50,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|35.25%|:green_apple:|
|:-|:-|:-:|

> There is no coverage information present for the Files changed`
        )
      })

      it('coverage lesser than min coverage', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 70,
            changed: 50,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|35.25%|:x:|
|:-|:-|:-:|

> There is no coverage information present for the Files changed`
        )
      })

      it('with title', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 70,
            changed: 50,
          },
          'Coverage',
          emoji
        )
        expect(comment).toEqual(
          `### Coverage
|Overall Project|35.25%|:x:|
|:-|:-|:-:|

> There is no coverage information present for the Files changed`
        )
      })
    })

    describe('single module', function () {
      const project = PROJECT.SINGLE_MODULE

      it('coverage greater than min coverage for overall project', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 30,
            changed: 60,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|35.25%|:green_apple:|
|:-|:-|:-:|
|Files changed|38.24%|:x:|
<br>

|File|Coverage||
|:-|:-|:-:|
|[StringOp.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/operation/StringOp.java)|100%|:green_apple:|
|[Math.kt](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/kotlin/com/madrapps/jacoco/Math.kt)|42%|:x:|
|[Utility.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/Utility.java)|18.03%|:green_apple:|`
        )
      })

      it('coverage lesser than min coverage for overall project', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 50,
            changed: 64,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|35.25%|:x:|
|:-|:-|:-:|
|Files changed|38.24%|:x:|
<br>

|File|Coverage||
|:-|:-|:-:|
|[StringOp.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/operation/StringOp.java)|100%|:green_apple:|
|[Math.kt](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/kotlin/com/madrapps/jacoco/Math.kt)|42%|:x:|
|[Utility.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/Utility.java)|18.03%|:green_apple:|`
        )
      })

      it('coverage lesser than min coverage for changed files', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 30,
            changed: 80,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|35.25%|:green_apple:|
|:-|:-|:-:|
|Files changed|38.24%|:x:|
<br>

|File|Coverage||
|:-|:-|:-:|
|[StringOp.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/operation/StringOp.java)|100%|:green_apple:|
|[Math.kt](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/kotlin/com/madrapps/jacoco/Math.kt)|42%|:x:|
|[Utility.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/Utility.java)|18.03%|:green_apple:|`
        )
      })

      it('coverage greater than min coverage for changed files', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 50,
            changed: 20,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|35.25%|:x:|
|:-|:-|:-:|
|Files changed|38.24%|:green_apple:|
<br>

|File|Coverage||
|:-|:-|:-:|
|[StringOp.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/operation/StringOp.java)|100%|:green_apple:|
|[Math.kt](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/kotlin/com/madrapps/jacoco/Math.kt)|42%|:green_apple:|
|[Utility.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/Utility.java)|18.03%|:green_apple:|`
        )
      })

      it('with title', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 50,
            changed: 20,
          },
          'Coverage',
          emoji
        )
        expect(comment).toEqual(
          `### Coverage
|Overall Project|35.25%|:x:|
|:-|:-|:-:|
|Files changed|38.24%|:green_apple:|
<br>

|File|Coverage||
|:-|:-|:-:|
|[StringOp.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/operation/StringOp.java)|100%|:green_apple:|
|[Math.kt](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/kotlin/com/madrapps/jacoco/Math.kt)|42%|:green_apple:|
|[Utility.java](https://github.com/thsaravana/jacoco-playground/blob/14a554976c0e5909d8e69bc8cce72958c49a7dc5/src/main/java/com/madrapps/jacoco/Utility.java)|18.03%|:green_apple:|`
        )
      })
    })

    describe('multi module', function () {
      const project = PROJECT.MULTI_MODULE

      it('coverage greater than min coverage for overall project', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 20,
            changed: 60,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|20.41%|:green_apple:|
|:-|:-|:-:|
|Files changed|7.32%|:x:|
<br>

|Module|Coverage||
|:-|:-|:-:|
|text|84.62%|:green_apple:|
|math|51.35%|:x:|
|app|6.85%|:x:|

<details>
<summary>Files</summary>

|Module|File|Coverage||
|:-|:-|:-|:-:|
|text|[StringOp.java](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/text/src/main/java/com/madrapps/text/StringOp.java)|84.62%|:green_apple:|
|math|[Math.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Math.kt)|59.38%|:x:|
||[Statistics.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Statistics.kt)|0%|:x:|
|app|[MainViewModel.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainViewModel.kt)|35.71%|:x:|
||[MainActivity.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainActivity.kt)|0%|:x:|
||[OnClickEvent.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/events/OnClickEvent.kt)|0%|:x:|

</details>`
        )
      })

      it('coverage lesser than min coverage for overall project', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 50,
            changed: 30,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|20.41%|:x:|
|:-|:-|:-:|
|Files changed|7.32%|:x:|
<br>

|Module|Coverage||
|:-|:-|:-:|
|text|84.62%|:green_apple:|
|math|51.35%|:x:|
|app|6.85%|:x:|

<details>
<summary>Files</summary>

|Module|File|Coverage||
|:-|:-|:-|:-:|
|text|[StringOp.java](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/text/src/main/java/com/madrapps/text/StringOp.java)|84.62%|:green_apple:|
|math|[Math.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Math.kt)|59.38%|:x:|
||[Statistics.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Statistics.kt)|0%|:x:|
|app|[MainViewModel.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainViewModel.kt)|35.71%|:x:|
||[MainActivity.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainActivity.kt)|0%|:x:|
||[OnClickEvent.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/events/OnClickEvent.kt)|0%|:x:|

</details>`
        )
      })

      it('coverage lesser than min coverage for changed files', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 20,
            changed: 90,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|20.41%|:green_apple:|
|:-|:-|:-:|
|Files changed|7.32%|:x:|
<br>

|Module|Coverage||
|:-|:-|:-:|
|text|84.62%|:x:|
|math|51.35%|:x:|
|app|6.85%|:x:|

<details>
<summary>Files</summary>

|Module|File|Coverage||
|:-|:-|:-|:-:|
|text|[StringOp.java](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/text/src/main/java/com/madrapps/text/StringOp.java)|84.62%|:x:|
|math|[Math.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Math.kt)|59.38%|:x:|
||[Statistics.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Statistics.kt)|0%|:x:|
|app|[MainViewModel.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainViewModel.kt)|35.71%|:x:|
||[MainActivity.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainActivity.kt)|0%|:x:|
||[OnClickEvent.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/events/OnClickEvent.kt)|0%|:x:|

</details>`
        )
      })

      it('coverage greater than min coverage for changed files', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 50,
            changed: 7,
          },
          '',
          emoji
        )
        expect(comment).toEqual(
          `|Overall Project|20.41%|:x:|
|:-|:-|:-:|
|Files changed|7.32%|:green_apple:|
<br>

|Module|Coverage||
|:-|:-|:-:|
|text|84.62%|:green_apple:|
|math|51.35%|:x:|
|app|6.85%|:x:|

<details>
<summary>Files</summary>

|Module|File|Coverage||
|:-|:-|:-|:-:|
|text|[StringOp.java](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/text/src/main/java/com/madrapps/text/StringOp.java)|84.62%|:green_apple:|
|math|[Math.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Math.kt)|59.38%|:x:|
||[Statistics.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Statistics.kt)|0%|:x:|
|app|[MainViewModel.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainViewModel.kt)|35.71%|:x:|
||[MainActivity.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainActivity.kt)|0%|:x:|
||[OnClickEvent.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/events/OnClickEvent.kt)|0%|:x:|

</details>`
        )
      })

      it('with title', function () {
        const comment = render.getPRComment(
          project,
          {
            overall: 50,
            changed: 90,
          },
          'Coverage',
          emoji
        )
        expect(comment).toEqual(
          `### Coverage
|Overall Project|20.41%|:x:|
|:-|:-|:-:|
|Files changed|7.32%|:x:|
<br>

|Module|Coverage||
|:-|:-|:-:|
|text|84.62%|:x:|
|math|51.35%|:x:|
|app|6.85%|:x:|

<details>
<summary>Files</summary>

|Module|File|Coverage||
|:-|:-|:-|:-:|
|text|[StringOp.java](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/text/src/main/java/com/madrapps/text/StringOp.java)|84.62%|:x:|
|math|[Math.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Math.kt)|59.38%|:x:|
||[Statistics.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/math/src/main/java/com/madrapps/math/Statistics.kt)|0%|:x:|
|app|[MainViewModel.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainViewModel.kt)|35.71%|:x:|
||[MainActivity.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/MainActivity.kt)|0%|:x:|
||[OnClickEvent.kt](https://github.com/thsaravana/jacoco-android-playground/blob/63aa82c13d2a6aadccb7a06ac7cb6834351b8474/app/src/main/java/com/madrapps/playground/events/OnClickEvent.kt)|0%|:x:|

</details>`
        )
      })
    })
  })
})