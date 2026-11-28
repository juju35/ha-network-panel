"""The inventory read from the device and entity registries of the network integrations."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.network_panel.const import CONF_SOURCES, CONF_SWITCHES, DEFAULTS, DOMAIN
from custom_components.network_panel.discovery import AP_RE, SWITCH_RE, async_inventory


def _entry(hass, domain, title=None):
    entry = MockConfigEntry(domain=domain, title=title or domain)
    entry.add_to_hass(hass)
    return entry


def _device(hass, entry, ident, name, model="", manufacturer=""):
    return dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(entry.domain, ident)},
        name=name,
        model=model,
        manufacturer=manufacturer,
    )


def _entity(hass, entry, device, domain, object_id, *, key=None, device_class=None, name=None, category=None):
    return (
        er.async_get(hass)
        .async_get_or_create(
            domain,
            entry.domain,
            f"{entry.entry_id}_{object_id}",
            config_entry=entry,
            device_id=device.id if device else None,
            suggested_object_id=object_id,
            translation_key=key,
            original_device_class=device_class,
            original_name=name,
            entity_category=category,
        )
        .entity_id
    )


def test_device_kinds_by_model():
    for model in ("USW Lite 8 PoE", "US-8-60W", "TL-SG2008P", "GS308E", "CRS326-24G", "Switch Flex Mini"):
        assert SWITCH_RE.search(model), model
    for model in ("U6 Lite", "U7 Pro", "UAP-AC-Lite", "EAP650", "Deco X50", "Mesh node"):
        assert AP_RE.search(model), model
    for model in ("Freebox v9", "UDM Pro", "OPNsense"):
        assert not SWITCH_RE.search(model), model


async def test_box_switch_and_access_point(hass: HomeAssistant):
    box_entry = _entry(hass, "freebox", "Freebox Server")
    box = _device(hass, box_entry, "box", "Freebox Server", "Freebox v9 (r1)", "Freebox SAS")
    down = _entity(
        hass, box_entry, box, "sensor", "freebox_download_speed", key="download_rate", device_class="data_rate"
    )
    up = _entity(hass, box_entry, box, "sensor", "freebox_upload_speed", key="upload_rate", device_class="data_rate")
    wan = _entity(hass, box_entry, box, "binary_sensor", "freebox_wan_status", device_class="connectivity")
    wifi = _entity(hass, box_entry, box, "switch", "freebox_wifi", key="wifi_state")

    unifi = _entry(hass, "unifi", "Home network")
    sw = _device(hass, unifi, "sw", "Office switch", "USW Lite 8 PoE", "Ubiquiti")
    ports = [_entity(hass, unifi, sw, "binary_sensor", f"office_switch_port_{n}", name=f"Port {n}") for n in (2, 1)]
    poe = _entity(hass, unifi, sw, "switch", "office_switch_port_1_poe")
    ap = _device(hass, unifi, "ap", "Living room AP", "U6 Lite", "Ubiquiti")
    clients = _entity(hass, unifi, ap, "sensor", "living_room_ap_clients")
    guest = _entity(hass, unifi, ap, "switch", "guest_wifi")
    # A device without entities is skipped
    _device(hass, unifi, "empty", "Phone")

    inv = async_inventory(hass)
    assert inv.box["name"] == "Freebox Server"
    assert inv.box["kind"] == "box"
    assert inv.box["entities"]["rate_down"] == down
    assert inv.box["entities"]["rate_up"] == up
    assert inv.box["entities"]["wan"] == wan
    assert inv.box["wifi"] == [wifi]

    assert [s["name"] for s in inv.switches] == ["Office switch"]
    # One port per number, in order, the link sensor before the PoE switch
    assert [(p["n"], p["entity"]) for p in inv.switches[0]["ports"]] == [(1, ports[1]), (2, ports[0])]
    assert poe not in [p["entity"] for p in inv.switches[0]["ports"]]

    assert [(r["name"], r["kind"]) for r in inv.routers] == [("Living room AP", "ap")]
    assert inv.routers[0]["entities"]["clients"] == clients
    assert inv.wifi == [wifi, guest]
    assert {s["platform"] for s in inv.sources} == {"freebox", "unifi"}


async def test_box_not_taken_from_a_tracked_host(hass: HomeAssistant):
    """The Freebox tracks the hosts of the network: a NAS sharing its device with its own integration (more entities,
    listed first) stays a host, the box is the device the hosts hang from."""
    nas_entry = _entry(hass, "ugreen", "UGREEN NAS")
    box_entry = _entry(hass, "freebox", "Freebox")
    reg = dr.async_get(hass)
    nas = reg.async_get_or_create(
        config_entry_id=nas_entry.entry_id,
        identifiers={("ugreen", "nas")},
        connections={(dr.CONNECTION_NETWORK_MAC, "aa:bb:cc:dd:ee:ff")},
        name="UGREEN DXP480T Plus",
        model="UGREEN DXP480T Plus",
    )
    for key in ("cpu", "ram", "temperature", "pool_1_total_size"):
        _entity(hass, nas_entry, nas, "sensor", f"nas_{key}")
    box = _device(hass, box_entry, "box", "Freebox v9 (r1)", "Freebox v9 (r1)", "Freebox SAS")
    host = reg.async_get_or_create(
        config_entry_id=box_entry.entry_id, connections={(dr.CONNECTION_NETWORK_MAC, "aa:bb:cc:dd:ee:ff")}
    )
    reg.async_update_device(host.id, via_device_id=box.id)
    _entity(hass, box_entry, nas, "device_tracker", "nas_tracker")
    wan = _entity(hass, box_entry, box, "binary_sensor", "freebox_wan_status", device_class="connectivity")

    inv = async_inventory(hass)
    assert inv.box["name"] == "Freebox v9 (r1)"
    assert inv.box["entities"]["wan"] == wan
    assert not inv.routers and not inv.switches


async def test_dns_speed_and_proxy(hass: HomeAssistant):
    adguard = _entry(hass, "adguard", "AdGuard Home")
    dev = _device(hass, adguard, "adg", "AdGuard Home")
    queries = _entity(hass, adguard, dev, "sensor", "adguard_home_dns_queries", key="dns_queries")
    blocked = _entity(hass, adguard, dev, "sensor", "adguard_home_dns_queries_blocked", key="dns_queries_blocked")
    ratio = _entity(
        hass, adguard, dev, "sensor", "adguard_home_dns_queries_blocked_ratio", key="dns_queries_blocked_ratio"
    )
    protection = _entity(hass, adguard, dev, "switch", "adguard_home_protection", key="protection")

    speed = _entry(hass, "speedtestdotcom", "Speedtest.net")
    sdev = _device(hass, speed, "st", "Speedtest.net")
    download = _entity(hass, speed, sdev, "sensor", "speedtest_download", key="download")
    upload = _entity(hass, speed, sdev, "sensor", "speedtest_upload", key="upload")
    ping = _entity(hass, speed, sdev, "sensor", "speedtest_ping", key="ping")

    proxy = _entry(hass, "nginx_proxy_manager", "Proxy")
    pdev = _device(hass, proxy, "npm", "Proxy")
    host = _entity(hass, proxy, pdev, "binary_sensor", "proxy_home", name="home.example.org")
    _entity(hass, proxy, pdev, "sensor", "proxy_version", category=er.EntityCategory.DIAGNOSTIC)

    inv = async_inventory(hass)
    assert inv.dns["entities"]["queries"] == queries
    assert inv.dns["entities"]["blocked"] == blocked
    assert inv.dns["entities"]["ratio"] == ratio
    assert inv.dns["switches"] == [protection]
    assert inv.speed["entities"] == {"download": download, "upload": upload, "ping": ping}
    assert inv.proxy["hosts"] == [{"id": host, "name": "home.example.org", "upstream": host, "problem": False}]
    assert inv.box is None


async def test_sources_and_switches_from_the_options(hass: HomeAssistant):
    unifi = _entry(hass, "unifi")
    ap = _device(hass, unifi, "ap", "Hallway", "Gateway Max")
    _entity(hass, unifi, ap, "sensor", "hallway_clients")
    other = _entry(hass, "snmp_switch")
    generic = _device(hass, other, "gen", "Rack switch", "Generic")
    port = _entity(hass, other, generic, "binary_sensor", "rack_port_3")
    MockConfigEntry(
        domain=DOMAIN, options={**DEFAULTS, CONF_SOURCES: ["unifi"], CONF_SWITCHES: [ap.id, generic.id]}
    ).add_to_hass(hass)

    inv = async_inventory(hass)
    # A device chosen as a switch is one, whatever its model; another integration's switch is added too
    assert [s["name"] for s in inv.switches] == ["Hallway", "Rack switch"]
    assert inv.switches[1]["platform"] == "snmp_switch"
    assert inv.switches[1]["ports"][0]["entity"] == port
    assert inv.routers == []

    hass.config_entries.async_update_entry(
        hass.config_entries.async_entries(DOMAIN)[0], options={CONF_SOURCES: ["freebox"]}
    )
    inv = async_inventory(hass)
    assert inv.switches == []
    assert inv.sources == []


async def test_reverse_proxy_hosts_by_rule_domain(hass: HomeAssistant):
    """Reverse Proxy: one host per rule domain (upstream check, certificate, expiring flag), its counters apart."""
    entry = _entry(hass, "reverse_proxy", "Zoraxy")
    dev = _device(hass, entry, "zoraxy", "Zoraxy")
    reg = er.async_get(hass)

    def add(domain, key, uid):
        return reg.async_get_or_create(
            domain,
            "reverse_proxy",
            f"{entry.entry_id}_{uid}",
            config_entry=entry,
            device_id=dev.id,
            translation_key=key,
        ).entity_id

    rules = add("sensor", "proxy_rules", "proxy_rules")
    active = add("sensor", "active_rules", "active_rules")
    running = add("binary_sensor", "proxy_running", "proxy_running")
    up_a = add("binary_sensor", "upstream_problem", "upstream_problem_a_example_org")
    cert_a = add("sensor", "certificate", "cert_expiry_a_example_org")
    exp_a = add("binary_sensor", "certificate_expiring", "cert_expiring_a_example_org")
    up_b = add("binary_sensor", "upstream_problem", "upstream_problem_b_example_org")
    add("switch", "https_redirect", "https_redirect")

    inv = async_inventory(hass)
    assert inv.proxy["summary"] == {"running": running, "rules": rules, "active": active}
    assert inv.proxy["hosts"] == [
        {"id": "a_example_org", "problem": True, "upstream": up_a, "cert": cert_a, "expiring": exp_a},
        {"id": "b_example_org", "problem": True, "upstream": up_b},
    ]


async def test_what_the_cards_show(hass: HomeAssistant):
    """Besides the rates: connection, calls, temperatures, fans, gauges, update, named ports, DNS and proxy extras."""
    box_entry = _entry(hass, "freebox", "Freebox Server")
    box = _device(hass, box_entry, "box", "Freebox Server", "Freebox v9 (r1)")
    conn = _entity(hass, box_entry, box, "sensor", "freebox_connection_type")
    missed = _entity(hass, box_entry, box, "sensor", "freebox_missed_calls", key="missed")
    mark = _entity(hass, box_entry, box, "button", "freebox_mark_calls_as_read", key="mark_calls_as_read")
    reboot = _entity(hass, box_entry, box, "button", "freebox_restart", device_class="restart")
    temp = _entity(hass, box_entry, box, "sensor", "freebox_cpu_temperature", device_class="temperature")
    fan = _entity(hass, box_entry, box, "sensor", "freebox_fan_speed", key="fan_speed")

    unifi = _entry(hass, "unifi", "Home network")
    ap = _device(hass, unifi, "ap", "Upstairs AP", "U6 Pro")
    cpu = _entity(hass, unifi, ap, "sensor", "upstairs_ap_cpu_utilization")
    ram = _entity(hass, unifi, ap, "sensor", "upstairs_ap_memory_utilization")
    update = _entity(hass, unifi, ap, "update", "upstairs_ap")
    sw = _device(hass, unifi, "sw", "Office switch", "USW Lite 8 PoE")
    _entity(hass, unifi, sw, "binary_sensor", "office_switch_port_1", name="Port 1")
    p2 = _entity(hass, unifi, sw, "binary_sensor", "office_switch_port_2", name="Port 2")
    er.async_get(hass).async_update_entity(p2, name="NAS")

    adguard = _entry(hass, "adguard", "AdGuard Home")
    adev = _device(hass, adguard, "adg", "AdGuard Home")
    _entity(hass, adguard, adev, "sensor", "adguard_home_dns_queries", key="dns_queries")
    rules = _entity(hass, adguard, adev, "sensor", "adguard_home_rules_count", key="rules_count")
    refresh = _entity(hass, adguard, adev, "button", "adguard_home_refresh_filters")
    dns_update = _entity(hass, adguard, adev, "update", "adguard_home")

    proxy = _entry(hass, "reverse_proxy", "Zoraxy")
    pdev = _device(hass, proxy, "zoraxy", "Zoraxy")
    reg = er.async_get(hass)

    def add(domain, key, uid):
        return reg.async_get_or_create(
            domain,
            "reverse_proxy",
            f"{proxy.entry_id}_{uid}",
            config_entry=proxy,
            device_id=pdev.id,
            translation_key=key,
        ).entity_id

    up = add("binary_sensor", "upstream_problem", "upstream_problem_a_example_org")
    renew = add("button", "renew", "renew_a_example_org")
    redirect = add("switch", "https_redirect", "https_redirect")
    dev_mode = add("switch", "development_mode", "development_mode")

    inv = async_inventory(hass)
    e = inv.box["entities"]
    assert (e["connection"], e["missed_calls"], e["mark_calls"], e["reboot"]) == (conn, missed, mark, reboot)
    assert inv.box["temps"] == [temp]
    assert inv.box["fans"] == [fan]
    # A CPU load, not the CPU temperature
    assert "cpu" not in e
    r = inv.routers[0]["entities"]
    assert (r["cpu"], r["ram"], r["update"]) == (cpu, ram, update)
    assert [(p["n"], p["named"]) for p in inv.switches[0]["ports"]] == [(1, False), (2, True)]
    assert rules in inv.dns["details"]
    assert inv.dns["buttons"] == [refresh]
    assert inv.dns["updates"] == [dns_update]
    assert inv.proxy["hosts"] == [{"id": "a_example_org", "problem": True, "upstream": up, "renew": renew}]
    assert inv.proxy["controls"] == [redirect, dev_mode]
