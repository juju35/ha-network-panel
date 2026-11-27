"""Constants for the Network Panel integration."""

DOMAIN = "network_panel"
VERSION = "1.0.2"

# Files served by the integration, and the sidebar panel (its own path, not /network_panel, so the frontend's panel
# route never shadows the files)
URL_BASE = f"/{DOMAIN}"
PANEL_URL = f"{URL_BASE}/network-panel.js"
I18N_URL = f"{URL_BASE}/i18n"
PANEL_PATH = "network"
PANEL_TITLE = "Network"
PANEL_ICON = "mdi:lan"

# The Home Assistant integrations the panel reads, by role. Each one is offered as a source in the config flow when
# it has an entry; its devices and entities are found in the registries (translation key, device class, entity id).
BOX_PLATFORMS = (
    "freebox",
    "livebox",
    "sfr_box",
    "bbox",
    "fritz",
    "vodafone_station",
    "huawei_lte",
    "starlink",
    "swisscom",
    "sagemcom_fast",
    "zte_hyperbox",
)
ROUTER_PLATFORMS = (
    "unifi",
    "tplink_omada",
    "tplink_deco",
    "opnsense",
    "pfsense",
    "asuswrt",
    "netgear",
    "mikrotik",
    "keenetic_ndms2",
    "firewalla",
    "openwrt",
    "luci",
    "ubus",
    "eero",
    "glinet",
)
DNS_PLATFORMS = ("adguard", "pi_hole")
SPEED_PLATFORMS = ("speedtestdotcom", "fastdotcom")
PROXY_PLATFORMS = ("reverse_proxy", "nginx_proxy_manager", "npm")
SOURCE_PLATFORMS = (*BOX_PLATFORMS, *ROUTER_PLATFORMS, *DNS_PLATFORMS, *SPEED_PLATFORMS, *PROXY_PLATFORMS)
# Their names in the config flow (brand names: the same in every language)
SOURCE_NAMES = {
    "freebox": "Freebox",
    "livebox": "Livebox",
    "sfr_box": "SFR Box",
    "bbox": "Bbox",
    "fritz": "FRITZ!Box",
    "vodafone_station": "Vodafone Station",
    "huawei_lte": "Huawei LTE",
    "starlink": "Starlink",
    "swisscom": "Swisscom Internet-Box",
    "sagemcom_fast": "Sagemcom F@st",
    "zte_hyperbox": "ZTE Hyperbox",
    "unifi": "UniFi Network",
    "tplink_omada": "TP-Link Omada",
    "tplink_deco": "TP-Link Deco",
    "opnsense": "OPNsense",
    "pfsense": "pfSense",
    "asuswrt": "ASUSWRT",
    "netgear": "NETGEAR",
    "mikrotik": "MikroTik",
    "keenetic_ndms2": "Keenetic",
    "firewalla": "Firewalla",
    "openwrt": "OpenWrt",
    "luci": "OpenWrt (LuCI)",
    "ubus": "OpenWrt (ubus)",
    "eero": "eero",
    "glinet": "GL.iNet",
    "adguard": "AdGuard Home",
    "pi_hole": "Pi-hole",
    "speedtestdotcom": "Speedtest.net",
    "fastdotcom": "Fast.com",
    "reverse_proxy": "Reverse Proxy",
    "nginx_proxy_manager": "Nginx Proxy Manager",
    "npm": "Nginx Proxy Manager",
}

# Options of the config entry: the sources read (integration domains; none chosen means every one found) and the
# devices shown as switches besides the ones recognised by their model (a generic switch, its ports as entities)
CONF_SOURCES = "sources"
CONF_SWITCHES = "switches"

# Settings (also options of the entry), edited in the panel's Settings tab. The panel is for administrators only.
CONF_SHOW_AWAY = "show_away"
CONF_CONFIRM_ACTIONS = "confirm_actions"
DEFAULTS = {
    CONF_SHOW_AWAY: True,
    CONF_CONFIRM_ACTIONS: True,
}
