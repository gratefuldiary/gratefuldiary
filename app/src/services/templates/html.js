module.exports = {
    welcome: {
        html:
`<p style="white-space: pre-line">Welcome to Grateful Diary, a diary to write down what you are grateful for, often and forever.

<strong> What are you grateful for? </strong>

To get started, simply <italic>reply</italic> to this email.

Gratitude comes in all styles & forms. This does not need to make you feel heavy to respond. Baby steps, if and when.

<strong> Privacy </strong>

Only you can read what you write and there is no wrong way to do this.

Your information will never be shared or sold.

<strong> Important </strong>

Its likely this email would have landed on your Updates folder. Mark this as important or just reply to not miss further prompts.

---

Previous entries: https://gratefuldiary.co/home
Account: https://gratefuldiary.co/account

</p>`,
        subject: `Welcome to Grateful Diary, {{name}}`,
    },
    daily: {
        html: `<p style="white-space: pre-line">
{{ if before }}
---
About {{before}}, you wrote:
{{log}}
---
{{ end }}

Simply just reply to this email to write your gratitude entry.

Grateful Diary: A diary to write down what you are grateful for, often and forever.
Previous entries: https://gratefuldiary.co/home
Account: https://gratefuldiary.co/account
</p>`,
        subject: `What are you grateful for? {{date}}`,
    },
}
