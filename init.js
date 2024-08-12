"use strict";

(function (TOKEN) {
    // do not change below this line
    var PARTNER = "INSALES.DADATA";
    var VERSION = "latest";
    var BASE_PATH = "https://cdn.jsdelivr.net/npm/suggestions-jquery@";
    var CSS_PATH = BASE_PATH + VERSION + "/dist/css/suggestions.min.css";
    var JS_PATH = BASE_PATH + VERSION + "/dist/js/jquery.suggestions.min.js";

    var Utils = {
        loadJS: function (path, callback) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = path;
            if (callback) {
                script.onload = function () {
                    callback();
                };
            }
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(script, s);
        },

        loadCSS: function (path) {
            var css = document.createElement("link");
            css.setAttribute("rel", "stylesheet");
            css.setAttribute("type", "text/css");
            css.setAttribute("href", path);
            document.getElementsByTagName("head")[0].appendChild(css);
        },

        pass: function () {},
    };
    1;

    var Suggestions = {
        init: function (selector, type, showFunc, clearFunc, options) {
            jQuery(selector).each(function (idx, elem) {
                var plugin = jQuery(elem)
                    .suggestions({
                        token: TOKEN,
                        partner: PARTNER,
                        type: type,
                        onSelect: showFunc,
                        onSelectNothing: clearFunc,
                    })
                    .suggestions();
                if (plugin && options) {
                    plugin.setOptions(options);
                }
            });
        },

        clearField: function (selector) {
            var $field = jQuery(selector);
            $field.val("");
            $field.parent().addClass("co-input--empty_nested");
        },

        showField: function (selector, value) {
            var $field = jQuery(selector);
            $field.val(value);
            $field.parent().removeClass("co-input--empty_nested");
        },

        setLocations: function (sgt, kladr_id) {
            sgt.setOptions({
                constraints: {
                    locations: { kladr_id: kladr_id },
                },
                restrict_value: true,
            });
        },

        clearLocations: function (sgt) {
            sgt.setOptions({
                constraints: {
                    locations: null,
                },
                restrict_value: false,
            });
        },
    };

    var Name = {
        init: function (selector) {
            if (jQuery("#client_surname").length) {
                // granular
                Name.initGranular(
                    jQuery("#client_surname"),
                    jQuery(selector),
                    jQuery("#client_middlename")
                );
            } else {
                // single field
                Suggestions.init(selector, "NAME", Utils.pass, Utils.pass);
            }
        },
        
        initGranular: function (surnameEl, nameEl, patronymicEl) {
            var fioParts = ["SURNAME", "NAME", "PATRONYMIC"];
            var self = {
                surnameEl: surnameEl,
                nameEl: nameEl,
                patronymicEl: patronymicEl,
                gender: "UNKNOWN",
            };
            [surnameEl, nameEl, patronymicEl].forEach(function ($el, index) {
                var sgt = $($el).suggestions({
                    token: TOKEN,
                    partner: PARTNER,
                    type: "NAME",
                    triggerSelectOnSpace: false,
                    hint: "",
                    noCache: true,
                    params: {
                        parts: [fioParts[index]],
                    },
                    onSearchStart: function (params) {
                        params.gender = Name.isGenderKnown.call(self, $el)
                            ? self.gender
                            : "UNKNOWN";
                    },
                    onSelect: function (suggestion) {
                        self.gender = suggestion.data.gender;
                    },
                });
            });
        },

        isGenderKnown: function ($el) {
            var self = this;
            var surname = self.$surname.val(),
                name = self.$name.val(),
                patronymic = self.$patronymic.val();
            if (
                ($el.attr("id") == self.$surname.attr("id") &&
                    !name &&
                    !patronymic) ||
                ($el.attr("id") == self.$name.attr("id") &&
                    !surname &&
                    !patronymic) ||
                ($el.attr("id") == self.$patronymic.attr("id") &&
                    !surname &&
                    !name)
            ) {
                return false;
            } else {
                return true;
            }
        },
    };

    var Party = {
        clear: function () {
            Suggestions.clearField("#client_juridical_address");
            Suggestions.clearField("#client_inn");
            Suggestions.clearField("#client_kpp");
            Suggestions.clearField("#client_ogrn");
        },

        show: function (suggestion) {
            var party = suggestion.data;
            var address = party.address.data
                ? party.address.data.postal_code + ", " + party.address.value
                : party.address.value;
            Suggestions.showField("#client_juridical_address", address);
            Suggestions.showField("#client_inn", party.inn);
            Suggestions.showField("#client_kpp", party.kpp);
            Suggestions.showField("#client_ogrn", party.ogrn);
        },
    };

    var Bank = {
        clear: function () {
            Suggestions.clearField("#client_bik");
            Suggestions.clearField("#client_correspondent_account");
        },

        show: function (suggestion) {
            var bank = suggestion.data;
            Suggestions.showField("#client_bik", bank.bic);
            Suggestions.showField(
                "#client_correspondent_account",
                bank.correspondent_account
            );
        },
    };

    var Address = {
        ADDRESS_SELECTORS: [
            "#shipping_address_address",
            "#shipping_address_street",
        ],
        COUNTRY_SELECTOR: "#shipping_address_country",
        ZIP_SELECTOR: "#shipping_address_zip",
        KLADR_SELECTOR: "[name='shipping_address[kladr_json]']",

        init: function () {
            Address.ADDRESS_SELECTORS.forEach(function (selector) {
                Suggestions.init(
                    selector,
                    "ADDRESS",
                    Address.show,
                    Address.clear
                );
            });
            Address.listenCountryChange();
        },

        clear: function () {
            Suggestions.clearField(Address.ZIP_SELECTOR);
        },

        show: function (suggestion) {
            var address = suggestion.data;
            Suggestions.showField(Address.ZIP_SELECTOR, address.postal_code);
        },

        listenCountryChange: function () {
            var $country = jQuery(Address.COUNTRY_SELECTOR);
            $country.on("change", function (e) {
                Address.onCountryChange(e.target.value);
            });
            Address.onCountryChange($country.val());
        },

        onCountryChange: function (countryCode) {
            Address.ADDRESS_SELECTORS.forEach(function (selector) {
                var sgt = jQuery(selector).suggestions();
                if (!sgt || !countryCode) {
                    return;
                }
                if (countryCode === "RU") {
                    sgt.enable();
                } else {
                    Suggestions.clearLocations(sgt);
                    sgt.clear();
                    sgt.disable();
                    Address.clear();
                }
            });
        },

        listenCityChange: function (citySelector) {
            var $city = jQuery(citySelector);
            $city.on("change", Address.onCityChange);
        },

        onCityChange: function (options) {
            var kladr_id = null;
            try {
                var kladr = JSON.parse(jQuery(Address.KLADR_SELECTOR).val());
                kladr_id = kladr.kladr_code || kladr.code;
            } catch (e) {
                // do nothing
            }
            Address.enforceCity(kladr_id, options);
        },

        enforceCity: function (kladr_id, options) {
            var options = options || {};
            Address.ADDRESS_SELECTORS.forEach(function (selector) {
                if (!options.keepOldValue) {
                    Suggestions.clearField(selector);
                    Suggestions.clearField(Address.ZIP_SELECTOR);
                }
                var sgt = jQuery(selector).suggestions();
                if (!sgt) {
                    return;
                }
                if (kladr_id) {
                    Suggestions.setLocations(sgt, kladr_id);
                } else {
                    Suggestions.clearLocations(sgt);
                }
            });
        },
    };

    var Suggestify = {
        init: function () {
            var initFunc = Suggestify.checkVersion();
            initFunc();
        },

        checkVersion: function () {
            if (
                jQuery("html").hasClass("insales-checkout2") ||
                jQuery("#order_form").data("checkout2")
            ) {
                return Suggestify.initV2;
            } else {
                return Suggestify.initV1;
            }
        },

        isAccountPage: function () {
            return jQuery("#new_client").length || jQuery("#contacts").length;
        },

        isParty: function () {
            return jQuery("#client_inn").is(":visible");
        },

        initV1: function () {
            if (Suggestify.isParty()) {
                Suggestions.init(
                    "#client_name",
                    "PARTY",
                    Party.show,
                    Party.clear
                );
            } else {
                Name.init("#client_name");
            }
            Suggestions.init(
                "#client_bank_name",
                "BANK",
                Bank.show,
                Bank.clear
            );
            Suggestions.init("#client_email", "EMAIL", Utils.pass, Utils.pass, {
                suggest_local: false,
            });
            Suggestions.init(
                "[name='email']",
                "EMAIL",
                Utils.pass,
                Utils.pass,
                { suggest_local: false }
            );
            Address.init();
            Address.listenCityChange("#shipping_address_city");
            Address.listenCityChange("#shipping_address_state");
            Address.onCityChange({ keepOldValue: true });
        },

        initV2: function () {
            if (Suggestify.isAccountPage()) {
                // specific for account
                if (Suggestify.isParty()) {
                    Suggestions.init(
                        "#client_name",
                        "PARTY",
                        Party.show,
                        Party.clear
                    );
                } else {
                    Name.init("#client_name");
                }
            } else {
                // specific for checkout
                Suggestions.init(
                    "#tabs-organization #client_name",
                    "PARTY",
                    Party.show,
                    Party.clear
                );
                Name.init("#tabs-person #client_name");
            }
            // common
            Suggestions.init(
                "#client_bank_name",
                "BANK",
                Bank.show,
                Bank.clear
            );
            Suggestions.init(
                "[name='client[email]']",
                "EMAIL",
                Utils.pass,
                Utils.pass,
                { suggest_local: false }
            );
            Suggestions.init(
                "[name='email']",
                "EMAIL",
                Utils.pass,
                Utils.pass,
                { suggest_local: false }
            );
            Address.init();
            Address.listenCityChange("#shipping_address_full_locality_name");
            Address.onCityChange({ keepOldValue: true });
        },
    };

    jQuery(function () {
        Utils.loadCSS(CSS_PATH);
        Utils.loadJS(JS_PATH, function () {
            Suggestify.init();
        });
    });
})(window.DADATA_TOKEN);
