module.exports = {
    welcome: {
        html:
`<p style="white-space: pre-line">Welcome to Grateful Diary, a diary to write down what you are grateful for, often and forever.

<strong> What are you grateful for? </strong>

To get started, simply reply for {{date}}.

Only you can read what you write and there is no wrong way to do this.

Gratitude comes in all styles & forms. This does not need to make you feel heavy to respond. Baby steps, if and when.

<strong> Privacy </strong>

Your information will never be shared or sold.

Only you can view your entries. You can always reply to this email.

---

Home: https://gratefuldiary.co/home
Account: https://gratefuldiary.co/account

</p>`,
        subject: `Welcome to Grateful Diary, {{name}}`,
    },
    daily: {
        html: `<p style="white-space: pre-line">Just reply to this email with your entry for {{date}}.

{{ if before }}
---
About {{before}}, you wrote:
{{log}}
---
{{ end }}

Grateful Diary: A diary to write down what you are grateful for, often and forever.
Home: https://gratefuldiary.co/home
Account: https://gratefuldiary.co/account
</p>`,
        subject: `What are you grateful for? {{date}}`,
    },
}
