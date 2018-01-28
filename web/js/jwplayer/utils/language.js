const _ = require('utils/underscore');

define([
], function () {

    /**
     * A map of 2-letter language codes (ISO 639-1) to language name in English
     */
    const codeToLang = {
        zh: 'Chinese',
        nl: 'Dutch',
        en: 'English',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        ja: 'Japanese',
        pt: 'Portuguese',
        ru: 'Russian',
        es: 'Spanish',
        el: 'Greek',
    };
    const langToCode = _.invert(codeToLang);

    function getLabel(language) {
        if (!language) {
            return;
        }

        // We do not map ISO 639-2 (3-letter codes)
        if (language.length === 3) {
            return language;
        }

        return codeToLang[language.slice(0, 2)] || language;
    }

    function getCode(language) {
        return langToCode[language] || '';
    }

    return {
        getLabel: getLabel,
        getCode: getCode
    };
});

