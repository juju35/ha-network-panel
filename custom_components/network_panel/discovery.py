"""Inventory of the home network, read from the device and entity registries.

Every supported integration (const.py) is read the same way: its devices, and for each device the entities the panel
needs, told by their translation key, device class or entity id, whatever the language. The panel then reads their
states. The connected devices are the router device trackers, read by the panel straight from the states.

- box: the internet box (the first device of a box integration): throughput, WAN link, uptime, external IP, Wi-Fi;
- routers: routers, firewalls, mesh nodes and access points, with their client count and Wi-Fi switches;
- switches: the switches (told by their model, or chosen in the options), with their ports;
- dns: AdGuard Home or Pi-hole, its query counters and its protection switches;
- speed: the speed test sensors (Speedtest.net, Fast.com);
- proxy: a reverse proxy's counters and its hosts (rule domains: upstream check, certificate).
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import (
    BOX_PLATFORMS,
    CONF_SOURCES,
    CONF_SWITCHES,
    DNS_PLATFORMS,
    DOMAIN,
    PROXY_PLATFORMS,
    ROUTER_PLATFORMS,
    SOURCE_PLATFORMS,
    SPEED_PLATFORMS,
)

# A device is a switch when its model or name says so (UniFi USW / US-8, Omada TL-SG / SG, Netgear GS / XS, MikroTik
# CRS / CSS, or the word itself), an access point when it is one (UniFi U6 / U7 / UAP, Omada EAP, mesh nodes).
SWITCH_RE = re.compile(
    r"switch|\busw|\bus-?\d|tl-?sg|\bsg\d{3}|\bgs\d{3}|\bxs\d{3}|\bes\d{3}|\bcrs\d|\bcss\d", re.IGNORECASE
)
AP_RE = re.compile(r"\bu[67]\b|\bu[67][-\s]|\buap|\beap\d|access ?point|\bap\b|mesh|\bdeco\b", re.IGNORECASE)

# Entity slots, by domain: a regular expression tried on the translation key, then on the entity id (object id).
SLOTS: dict[str, tuple[str, str | None, re.Pattern[str]]] = {
    "rate_down": (
        "sensor",
        "data_rate",
        re.compile(r"down|_rx\b|rate_rx|receiv|download|kb_s_received|stream_down", re.IGNORECASE),
    ),
    "rate_up": (
        "sensor",
        "data_rate",
        re.compile(r"(?<!down)up|_tx\b|rate_tx|sent|upload|kb_s_sent|stream_up", re.IGNORECASE),
    ),
    "wan": ("binary_sensor", "connectivity", re.compile(r"wan|connect|link|internet|status", re.IGNORECASE)),
    "uptime": ("sensor", None, re.compile(r"uptime|boot|last_restart|sys_uptime", re.IGNORECASE)),
    "ip": ("sensor", None, re.compile(r"external_ip(v4)?$|wan_ip|public_ip|ip_address$", re.IGNORECASE)),
    "clients": ("sensor", None, re.compile(r"clients|connected_devices|devices_connected|^devices$", re.IGNORECASE)),
    "temperature": ("sensor", "temperature", re.compile(r".", re.IGNORECASE)),
    "reboot": ("button", "restart", re.compile(r".", re.IGNORECASE)),
}
WIFI_RE = re.compile(r"wi-?fi|wlan|ssid|guest", re.IGNORECASE)
PORT_RE = re.compile(r"port[ _-]?(\d{1,2})(?!\d)", re.IGNORECASE)
DNS_SLOTS = {
    "queries": re.compile(r"^(dns_)?queries(_today)?$|dns_queries_today|^dns_queries$", re.IGNORECASE),
    "blocked": re.compile(r"blocked(_today)?$|ads_blocked", re.IGNORECASE),
    "ratio": re.compile(r"ratio|percentage|percent", re.IGNORECASE),
    "speed": re.compile(r"processing|average|speed|response", re.IGNORECASE),
    "clients": re.compile(r"clients", re.IGNORECASE),
}
SPEED_SLOTS = {
    "download": re.compile(r"download", re.IGNORECASE),
    "upload": re.compile(r"upload", re.IGNORECASE),
    "ping": re.compile(r"ping|latency", re.IGNORECASE),
}


@dataclass
class Device:
    """A box, router, access point or switch, with the entity ids the panel reads."""

    id: str
    name: str
    platform: str
    kind: str
    model: str = ""
    manufacturer: str = ""
    sw_version: str = ""
    url: str = ""
    entities: dict[str, str] = field(default_factory=dict)
    wifi: list[str] = field(default_factory=list)
    ports: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class Inventory:
    """What the panel shows; `sources` lists the integrations read and whether each one is loaded."""

    box: dict[str, Any] | None = None
    routers: list[dict[str, Any]] = field(default_factory=list)
    switches: list[dict[str, Any]] = field(default_factory=list)
    wifi: list[str] = field(default_factory=list)
    dns: dict[str, Any] | None = None
    speed: dict[str, Any] | None = None
    proxy: dict[str, Any] | None = None
    sources: list[dict[str, Any]] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def _key(entry: er.RegistryEntry) -> str:
    return entry.translation_key or ""


def _object_id(entry: er.RegistryEntry) -> str:
    return entry.entity_id.split(".", 1)[1]


def _class(entry: er.RegistryEntry) -> str | None:
    return entry.device_class or entry.original_device_class


def _match(entry: er.RegistryEntry, pattern: re.Pattern[str]) -> bool:
    return bool(pattern.search(_key(entry)) or pattern.search(_object_id(entry)))


def _slots(entities: list[er.RegistryEntry]) -> dict[str, str]:
    """The first entity of each slot (translation key first, then entity id)."""
    found: dict[str, str] = {}
    for slot, (domain, device_class, pattern) in SLOTS.items():
        candidates = [e for e in entities if e.domain == domain and (device_class is None or _class(e) == device_class)]
        by_key = [e for e in candidates if pattern.search(_key(e))]
        by_id = [e for e in candidates if pattern.search(_object_id(e))]
        if pick := (by_key or by_id):
            if slot == "rate_up" and found.get("rate_down") == pick[0].entity_id:
                continue
            found[slot] = pick[0].entity_id
    return found


def _ports(entities: list[er.RegistryEntry]) -> list[dict[str, Any]]:
    """Port entities (switch or binary sensor named after a port number), one per port, in port order."""
    ports: dict[int, dict[str, Any]] = {}
    for e in entities:
        if e.domain not in ("switch", "binary_sensor", "sensor"):
            continue
        m = PORT_RE.search(_key(e)) or PORT_RE.search(_object_id(e)) or PORT_RE.search(e.original_name or "")
        if not m:
            continue
        n = int(m.group(1))
        # A link binary sensor wins over a PoE switch or a counter of the same port
        rank = {"binary_sensor": 0, "switch": 1, "sensor": 2}[e.domain]
        if n not in ports or rank < ports[n]["rank"]:
            ports[n] = {"n": n, "entity": e.entity_id, "label": e.name or e.original_name or "", "rank": rank}
    return [{k: v for k, v in p.items() if k != "rank"} for _, p in sorted(ports.items())]


def _kind(platform: str, device: dr.DeviceEntry, switches: set[str]) -> str:
    text = " ".join(filter(None, (device.model, device.name, device.name_by_user)))
    if device.id in switches or SWITCH_RE.search(text):
        return "switch"
    if platform in BOX_PLATFORMS:
        return "box"
    if AP_RE.search(text):
        return "ap"
    return "router"


def _device(platform: str, device: dr.DeviceEntry, entities: list[er.RegistryEntry], switches: set[str]) -> Device:
    kind = _kind(platform, device, switches)
    return Device(
        id=device.id,
        name=device.name_by_user or device.name or device.model or platform,
        platform=platform,
        kind=kind,
        model=device.model or "",
        manufacturer=device.manufacturer or "",
        sw_version=device.sw_version or "",
        url=device.configuration_url or "",
        entities=_slots(entities),
        wifi=[
            e.entity_id for e in entities if e.domain == "switch" and _match(e, WIFI_RE) and not PORT_RE.search(_key(e))
        ],
        ports=_ports(entities) if kind == "switch" else [],
    )


def _first(entities: list[er.RegistryEntry], domain: str, slots: dict[str, re.Pattern[str]]) -> dict[str, str]:
    found: dict[str, str] = {}
    for slot, pattern in slots.items():
        for e in entities:
            if e.domain == domain and _match(e, pattern) and e.entity_id not in found.values():
                found[slot] = e.entity_id
                break
    return found


# Reverse Proxy (juju35/ha-reverse-proxy): the proxy's counters, and per rule domain its upstream check (a problem
# sensor, on when an upstream is offline), its certificate's expiry (timestamp) and its expiring flag.
PROXY_SUMMARY = {
    "running": "proxy_running",
    "rules": "proxy_rules",
    "active": "active_rules",
    "certificates": "tls_certificates",
    "version": "version",
}
PROXY_HOST_KEYS = {"upstream_problem": "upstream", "certificate": "cert", "certificate_expiring": "expiring"}
PROXY_HOST_ID = re.compile(r"_(?:upstream_problem|cert_expiry|cert_expiring)_(.+)$")


def _proxy(entry: Any, entities: list[er.RegistryEntry]) -> dict[str, Any]:
    """The proxy's summary entities and its hosts: one per rule domain (Reverse Proxy), else one per binary sensor
    or sensor of the integration (a problem sensor is bad when on, any other when off)."""
    keyed = {e.translation_key: e.entity_id for e in entities if e.translation_key in PROXY_SUMMARY.values()}
    summary = {slot: keyed[key] for slot, key in PROXY_SUMMARY.items() if key in keyed}
    hosts: dict[str, dict[str, Any]] = {}
    for e in entities:
        role = PROXY_HOST_KEYS.get(e.translation_key or "")
        m = PROXY_HOST_ID.search(e.unique_id or "")
        if role and m:
            hosts.setdefault(m.group(1), {"id": m.group(1), "problem": True})[role] = e.entity_id
    if hosts:
        out = [h for h in hosts.values() if "upstream" in h or "cert" in h]
    else:
        out = [
            {
                "id": e.entity_id,
                "name": e.name or e.original_name or _object_id(e),
                "upstream": e.entity_id,
                "problem": (e.device_class or e.original_device_class) == "problem",
            }
            for e in entities
            if e.domain in ("binary_sensor", "sensor") and not e.entity_category
        ]
    return {"summary": summary, "hosts": sorted(out, key=lambda h: str(h.get("name") or h["id"]))}


def _box_id(entry_devices: list[dr.DeviceEntry], device_entities: Any) -> str | None:
    """The box among a box integration's devices: not behind another of its devices (the hosts it tracks are, and
    their device can carry another integration's name), with more than presence trackers, the most entities first."""
    ids = {d.id for d in entry_devices}
    best: tuple[int, int, str] | None = None
    for device in entry_devices:
        if device.entry_type is dr.DeviceEntryType.SERVICE:
            continue
        own = device_entities(device.id)
        if not own or all(e.domain == "device_tracker" for e in own):
            continue
        rank = (0 if device.via_device_id in ids else 1, len(own), device.id)
        if best is None or rank > best:
            best = rank
    return best[2] if best else None


@callback
def async_inventory(hass: HomeAssistant) -> Inventory:
    """Scan the registries for the sources chosen in the options (every supported one when none is chosen)."""
    entries = hass.config_entries.async_entries(DOMAIN)
    options = entries[0].options if entries else {}
    chosen = set(options.get(CONF_SOURCES) or SOURCE_PLATFORMS)
    switches = set(options.get(CONF_SWITCHES) or [])
    devices = dr.async_get(hass)
    entities = er.async_get(hass)
    inv = Inventory()
    seen: set[str] = set()

    def device_entities(device_id: str, entry_id: str | None = None) -> list[er.RegistryEntry]:
        """A device's enabled entities; with entry_id, only that entry's (a device can be shared by integrations)."""
        return [
            e
            for e in er.async_entries_for_device(entities, device_id)
            if not e.disabled_by and (entry_id is None or e.config_entry_id == entry_id)
        ]

    for platform in SOURCE_PLATFORMS:
        if platform not in chosen:
            continue
        for entry in hass.config_entries.async_entries(platform):
            inv.sources.append(
                {"platform": platform, "title": entry.title, "state": entry.state.value, "entry_id": entry.entry_id}
            )
            entry_entities = [
                e for e in er.async_entries_for_config_entry(entities, entry.entry_id) if not e.disabled_by
            ]
            if platform in DNS_PLATFORMS:
                if inv.dns is None:
                    inv.dns = {
                        "platform": platform,
                        "title": entry.title,
                        "entities": _first(entry_entities, "sensor", DNS_SLOTS),
                        "switches": [e.entity_id for e in entry_entities if e.domain == "switch"],
                    }
                continue
            if platform in SPEED_PLATFORMS:
                if inv.speed is None:
                    inv.speed = {
                        "platform": platform,
                        "title": entry.title,
                        "entities": _first(entry_entities, "sensor", SPEED_SLOTS),
                    }
                continue
            if platform in PROXY_PLATFORMS:
                if inv.proxy is None:
                    inv.proxy = {"platform": platform, "title": entry.title, **_proxy(entry, entry_entities)}
                continue
            entry_devices = dr.async_entries_for_config_entry(devices, entry.entry_id)
            box_id = (
                _box_id(entry_devices, lambda d, eid=entry.entry_id: device_entities(d, eid))
                if platform in BOX_PLATFORMS
                else None
            )
            for device in entry_devices:
                if device.id in seen or device.entry_type is dr.DeviceEntryType.SERVICE:
                    continue
                own = device_entities(device.id, entry.entry_id)
                if not own and not SWITCH_RE.search(device.model or ""):
                    continue
                item = _device(platform, device, own, switches)
                # A box integration also tracks the hosts of the network (a NAS, a phone…): only the box itself
                if item.kind == "box" and device.id != box_id:
                    continue
                seen.add(device.id)
                if item.kind == "box" and inv.box is None:
                    inv.box = asdict(item)
                elif item.kind == "switch":
                    inv.switches.append(asdict(item))
                elif item.kind != "box" and platform in ROUTER_PLATFORMS:
                    inv.routers.append(asdict(item))
                for wifi in item.wifi:
                    if wifi not in inv.wifi:
                        inv.wifi.append(wifi)

    # Switches chosen in the options that no supported integration brought (a generic switch, its ports as entities)
    for device_id in switches - seen:
        if (device := devices.async_get(device_id)) is None:
            continue
        entry_id = (
            device.config_entry_id
            if hasattr(type(device), "config_entry_id")
            else next(iter(device.config_entries), None)
        )
        entry = hass.config_entries.async_get_entry(entry_id) if entry_id else None
        item = _device(entry.domain if entry else "", device, device_entities(device_id), switches)
        inv.switches.append(asdict(item))
    return inv
