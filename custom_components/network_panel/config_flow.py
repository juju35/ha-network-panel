"""Config flow: one entry, the sources read and the extra switches (also in the options)."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import selector

from .const import CONF_SOURCES, CONF_SWITCHES, DEFAULTS, DOMAIN, SOURCE_NAMES, SOURCE_PLATFORMS


def available_sources(hass: HomeAssistant) -> list[str]:
    """The supported integrations that have an entry, in the order of SOURCE_PLATFORMS."""
    return [domain for domain in SOURCE_PLATFORMS if hass.config_entries.async_entries(domain)]


def _schema(hass: HomeAssistant, current: dict[str, Any]) -> vol.Schema:
    sources = available_sources(hass)
    chosen = [s for s in current.get(CONF_SOURCES) or sources if s in sources]
    fields: dict[Any, Any] = {}
    if sources:
        fields[vol.Optional(CONF_SOURCES, default=chosen)] = selector.SelectSelector(
            selector.SelectSelectorConfig(
                options=[selector.SelectOptionDict(value=s, label=SOURCE_NAMES.get(s, s)) for s in sources],
                multiple=True,
                mode=selector.SelectSelectorMode.LIST,
            )
        )
    fields[vol.Optional(CONF_SWITCHES, default=list(current.get(CONF_SWITCHES, [])))] = selector.DeviceSelector(
        selector.DeviceSelectorConfig(multiple=True)
    )
    return vol.Schema(fields)


def _clean(user_input: dict[str, Any]) -> dict[str, Any]:
    return {
        CONF_SOURCES: list(user_input.get(CONF_SOURCES, [])),
        CONF_SWITCHES: list(user_input.get(CONF_SWITCHES, [])),
    }


class NetworkPanelConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add the network panel to the sidebar."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is None:
            found = available_sources(self.hass)
            return self.async_show_form(
                step_id="user",
                data_schema=_schema(self.hass, {}),
                description_placeholders={"count": str(len(found))},
            )
        return self.async_create_entry(title="Network Panel", data={}, options={**DEFAULTS, **_clean(user_input)})

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return NetworkPanelOptionsFlow()


class NetworkPanelOptionsFlow(OptionsFlow):
    """Change the sources and the extra switches; the display settings stay in the panel."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is None:
            return self.async_show_form(step_id="init", data_schema=_schema(self.hass, dict(self.config_entry.options)))
        return self.async_create_entry(data={**self.config_entry.options, **_clean(user_input)})
