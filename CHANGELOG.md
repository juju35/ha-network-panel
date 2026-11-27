# Changelog

## 1.0.2 - 2026-11-27

### Fixes
- Proxy: each host is a rule domain of Reverse Proxy, counted once, instead of every entity of the integration (counters, switches, certificates…); an upstream check reads offline when its problem sensor is on, not when it is off, and not monitored when unknown.
- Proxy tab reworked like the other tabs: the proxy's state pill and its active rules, online hosts, hosts in error and expiring certificates, then the hosts as cards, problems first, each with its certificate expiry and a link to the domain.

## 1.0.1 - 2026-11-27

### Fixes
- The box is the box itself, not a host it tracks: a NAS or another device that shares its device with its own integration no longer replaces the Freebox (and the status pill no longer reads "No internet box").
- Only the box integration's own entities are read on a device shared with another integration.
- Switch ports set up as SNMP sensors in YAML (no device) are found by the switch's name (`sensor.<switch>_port_<n>_status`), and an SNMP port reading 2 (down) is no longer shown up.
- Switches chosen in the settings no longer fail on Home Assistant versions without a device's main config entry.

## 1.0.0 - 2026-11-27

### Features
- **Network** sidebar panel (administrators only) on top of the integrations of the network gear: internet box, routers, firewalls and mesh access points, several switches, Wi-Fi networks, connected devices, DNS filter (AdGuard Home, Pi-hole), speed tests (Speedtest.net, Fast.com) and reverse proxy.
- Illustrated top bar with the box, the switches' rack and the router, day and night, and a status pill.
- Tabs: Overview (topology, speed, Wi-Fi, devices, DNS, proxy), Devices (search and filters), Wi-Fi & switches (Wi-Fi switches, routers and access points, each switch's front panel with its port links), DNS, Speed (30-day peaks, run a test), Proxy and Settings; tabs without a source are hidden.
- Config flow and options: the integrations read, and the devices shown as switches whatever their integration.
- 22 languages.
