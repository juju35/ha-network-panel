"""Setup, the config flow, the sidebar panel and the WebSocket commands."""

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.network_panel.const import (
    CONF_SOURCES,
    CONF_SWITCHES,
    DEFAULTS,
    DOMAIN,
    PANEL_ICON,
    PANEL_PATH,
    PANEL_URL,
    VERSION,
)
from custom_components.network_panel.panel import INVENTORY_CACHE


async def _setup(hass: HomeAssistant, options=None) -> MockConfigEntry:
    assert await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, title="Network Panel", data={}, options=options or dict(DEFAULTS))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_config_flow_single_entry(hass: HomeAssistant):
    MockConfigEntry(domain="freebox", title="Freebox").add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "form"
    assert result["description_placeholders"]["count"] == "1"
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_SOURCES: ["freebox"], CONF_SWITCHES: []}
    )
    assert result["type"] == "create_entry"
    assert result["title"] == "Network Panel"
    assert result["options"] == {**DEFAULTS, CONF_SOURCES: ["freebox"], CONF_SWITCHES: []}
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "abort"
    assert result["reason"] == "single_instance_allowed"


async def test_options_flow_keeps_the_settings(hass: HomeAssistant):
    MockConfigEntry(domain="unifi", title="Home network").add_to_hass(hass)
    entry = await _setup(hass, {**DEFAULTS, "confirm_actions": False})
    hass.data[INVENTORY_CACHE] = ("stale", {})
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] == "form"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_SOURCES: ["unifi"], CONF_SWITCHES: []}
    )
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()
    assert entry.options[CONF_SOURCES] == ["unifi"]
    assert entry.options["confirm_actions"] is False
    # New options: the inventory is scanned again
    assert INVENTORY_CACHE not in hass.data


async def test_panel_registered_for_admins(hass: HomeAssistant):
    entry = await _setup(hass)
    panel = hass.data["frontend_panels"][PANEL_PATH]
    assert panel.sidebar_icon == PANEL_ICON
    assert panel.require_admin is True
    assert panel.config["_panel_custom"]["module_url"] == f"{PANEL_URL}?v={VERSION}"
    assert panel.config["_panel_custom"]["name"] == "network-panel"
    await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_PATH not in hass.data["frontend_panels"]


async def test_inventory_and_settings(hass: HomeAssistant, hass_ws_client):
    await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/inventory"})
    res = await client.receive_json()
    assert res["success"]
    assert res["result"]["box"] is None
    assert res["result"]["switches"] == []
    assert res["result"]["settings"] == DEFAULTS

    await client.send_json_auto_id({"type": f"{DOMAIN}/update_settings", "show_away": False})
    res = await client.receive_json()
    assert res["success"]
    assert res["result"]["settings"] == {**DEFAULTS, "show_away": False}

    await client.send_json_auto_id({"type": f"{DOMAIN}/settings"})
    res = await client.receive_json()
    assert res["result"]["settings"]["show_away"] is False

    # An unknown setting is refused
    await client.send_json_auto_id({"type": f"{DOMAIN}/update_settings", "nope": True})
    res = await client.receive_json()
    assert not res["success"]


async def test_commands_are_for_administrators(hass: HomeAssistant, hass_ws_client, hass_admin_user):
    await _setup(hass)
    hass_admin_user.groups = []
    client = await hass_ws_client(hass)
    for command in ("inventory", "settings", "update_settings"):
        await client.send_json_auto_id({"type": f"{DOMAIN}/{command}"})
        res = await client.receive_json()
        assert not res["success"]
        assert res["error"]["code"] == "unauthorized"
