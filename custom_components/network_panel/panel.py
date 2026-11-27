"""Sidebar panel and its WebSocket commands.

The panel (``frontend/network-panel.js``) has seven tabs: Overview, Devices, Wi-Fi, DNS, Speed, Proxy and Settings.
It reads the states of the entities of the supported integrations and acts through their switches and buttons, so it
only needs:

- ``network_panel/inventory``: the box, routers, switches, Wi-Fi switches, DNS filter, speed test and proxy with
  their entity ids, and the settings;
- ``network_panel/settings`` / ``network_panel/update_settings``: the settings (options of the entry).

The panel and its commands are for administrators only.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import panel_custom, websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import DEFAULTS, DOMAIN, PANEL_ICON, PANEL_PATH, PANEL_TITLE, PANEL_URL, SOURCE_PLATFORMS, VERSION
from .discovery import async_inventory


def settings(entry: ConfigEntry | None) -> dict[str, Any]:
    """The settings, defaults filled in (an option no longer offered is left out)."""
    options = entry.options if entry else {}
    return {key: options.get(key, default) for key, default in DEFAULTS.items()}


def _entry(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


async def async_register_panel(hass: HomeAssistant) -> None:
    """Add Network to the sidebar, for administrators only."""
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="network-panel",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{PANEL_URL}?v={VERSION}",
        require_admin=True,
        config={"version": VERSION},
    )


# The last inventory, kept until a registry changes, a source entry changes state or title, or the options change
INVENTORY_CACHE = f"{DOMAIN}_inventory"


def _cache_key(hass: HomeAssistant) -> tuple:
    entry = _entry(hass)
    options = tuple(sorted((k, str(v)) for k, v in (entry.options if entry else {}).items()))
    entries = tuple(
        (e.entry_id, e.state.value, e.title)
        for domain in SOURCE_PLATFORMS
        for e in hass.config_entries.async_entries(domain)
    )
    return (options, entries)


@callback
def cached_inventory(hass: HomeAssistant) -> dict[str, Any]:
    """The inventory, scanned again only when something it reads may have changed (not on every panel call)."""
    key = _cache_key(hass)
    cache = hass.data.get(INVENTORY_CACHE)
    if cache is None or cache[0] != key:
        cache = hass.data[INVENTORY_CACHE] = (key, async_inventory(hass).as_dict())
    return cache[1]


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """The panel's WebSocket commands, and the inventory dropped when the registries change."""
    for command in (_ws_inventory, _ws_settings, _ws_update_settings):
        websocket_api.async_register_command(hass, command)

    @callback
    def _drop(_: Event) -> None:
        hass.data.pop(INVENTORY_CACHE, None)

    hass.bus.async_listen(dr.EVENT_DEVICE_REGISTRY_UPDATED, _drop)
    hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, _drop)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/inventory"})
@websocket_api.require_admin
@callback
def _ws_inventory(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    connection.send_result(msg["id"], {**cached_inventory(hass), "settings": settings(_entry(hass))})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/settings"})
@websocket_api.require_admin
@callback
def _ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    connection.send_result(msg["id"], {"settings": settings(_entry(hass))})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_settings",
        **{vol.Optional(key): bool for key in DEFAULTS},
    }
)
@websocket_api.require_admin
@callback
def _ws_update_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    if (entry := _entry(hass)) is None:
        connection.send_result(msg["id"], {"ok": False, "error": "not_found"})
        return
    current = settings(entry)
    updated = {**current, **{key: msg[key] for key in DEFAULTS if key in msg}}
    if updated != current:
        hass.config_entries.async_update_entry(entry, options={**entry.options, **updated})
    connection.send_result(msg["id"], {"ok": True, "settings": updated})
