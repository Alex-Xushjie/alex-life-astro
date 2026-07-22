---
title: "IPv4 Multicast Addressing and Ethernet MAC Mapping"
date: 2026-07-19
category: "Network Engineering"
cover: /images/Multicast_Series.webp
tags:
  - Multicast
  - IGMP
  - IGMP Snooping
  - PIM
  - ASM
  - SSM
  - Market Data
series: "Multicast"
pinned: false
draft: false
---
# IPv4 Multicast Addressing and Ethernet MAC Mapping

In the previous article, we built a high-level map of multicast: sources send traffic to a logical group, receivers express interest, and the network replicates packets only where downstream paths branch.

This article moves one level deeper and focuses on two closely related questions:

1. How is the IPv4 multicast address space organized?
2. How does an IPv4 multicast group become an Ethernet multicast MAC address?

These two topics belong together because multicast traffic is identified by an IP group at Layer 3, but an Ethernet switch still needs a destination MAC address at Layer 2.

By the end of this article, you should be able to:

- Recognize the main IPv4 multicast address blocks;
- Distinguish Group `G` from an SSM Channel `(S,G)`;
- Explain the difference between address scope, TTL, and administrative boundaries;
- Calculate the Ethernet multicast MAC for any IPv4 multicast group;
- Explain why 32 different IPv4 groups can map to the same MAC;
- Identify the planning risks created by multicast MAC overlap.

---

## 1. The Nature of an IPv4 Multicast Address

### 1.1 A Multicast Address Is a Destination Address

An IPv4 multicast address identifies a logical receiver group. It can therefore appear only in the destination-address field of an IPv4 packet.

A valid multicast packet looks like this:

```text
Source IP:      192.168.10.10
Destination IP: 239.1.1.1
```

The source address identifies the sender, while the destination address identifies the multicast group.

A multicast address cannot be used as an IPv4 source address:

```text
Source IP:      239.1.1.1
Destination IP: 192.168.10.20
```

This is invalid because `239.1.1.1` represents a group, not a transmitting host.

A useful way to remember the distinction is:

```text
Source Address = Who sent the traffic?
Group Address  = Which logical channel carries the traffic?
```

---

### 1.2 A Group Address Is Not an Interface Address

A unicast address is normally configured directly on an interface:

```text
interface Ethernet0
 ip address 192.168.10.20 255.255.255.0
```

A multicast group is different. The group address is not assigned to an interface as the interface's host address.

Instead, an application asks the operating system to join a group through a specific interface:

```text
Application
    │
    │ Join 239.1.1.1 on ens3
    ▼
Operating System
    │
    ▼
Interface ens3
```

The distinction is important:

> A multicast group address identifies a logical receiver group rather than a specific host or interface.

The host joins the group **through** an interface; it does not configure the group **as** the interface address.

---

### 1.3 Multicast Group and SSM Channel

In Any-Source Multicast, or ASM, a receiver normally identifies only the group:

```text
G
```

For example:

```text
239.1.1.1
```

This logical object is called a multicast group.

In Source-Specific Multicast, or SSM, a receiver identifies both the source and the group:

```text
(S,G)
```

For example:

```text
(10.1.1.10, 232.1.1.1)
```

This is called an SSM channel.

Two channels can use the same group and still be different because the sources are different:

```text
(10.1.1.10, 232.1.1.1)
(10.1.1.20, 232.1.1.1)
```

For operational documentation, especially in market-data environments, the complete service identifier is often:

```text
Source IP + Group IP + UDP Port
```

---

## 2. The IPv4 Multicast Address Space

IPv4 multicast uses:

```text
224.0.0.0/4
```

The complete range is:

```text
224.0.0.0 - 239.255.255.255
```

Traditional classful terminology called this the Class D address space. Modern documentation usually calls it the IPv4 multicast address space.

The four most significant bits are fixed:

```text
1110
```

```text
┌──────────┬────────────────────────────┐
│   1110   │       Remaining 28 bits    │
└──────────┴────────────────────────────┘
  4 bits             28 bits
```

The remaining 28 bits theoretically provide:

```text
2^28 = 268,435,456
```

possible values.

However, the range is not one large pool from which applications can choose arbitrary addresses. IANA has divided it into blocks with different purposes and scopes.

---

## 3. The Most Important IPv4 Multicast Address Blocks

The following blocks are the most important for day-to-day network design.

| Address Range | Name | Main Purpose |
|---|---|---|
| `224.0.0.0/24` | Local Network Control Block | Protocol control traffic limited to the local link |
| `224.0.1.0/24` | Internetwork Control Block | Control traffic whose address semantics allow routed use |
| `232.0.0.0/8` | Source-Specific Multicast Block | Standard IPv4 SSM range |
| `233.0.0.0/8` | GLOP and Special Assignments | Historical allocation and special-purpose space |
| `233.252.0.0/24` | MCAST-TEST-NET | Documentation and examples |
| `239.0.0.0/8` | Administratively Scoped Block | Multicast services within an administrative domain |

Other ranges inside `224.0.0.0/4` are reserved or assigned for special purposes. They should not be used without checking the relevant IANA allocation.

---

## 4. Local Network Control Block: `224.0.0.0/24`

The Local Network Control Block is:

```text
224.0.0.0 - 224.0.0.255
```

Traffic sent to this block is not forwarded by routers off the local link.

Common addresses include:

| Address | Purpose |
|---|---|
| `224.0.0.1` | All Systems on This Subnet |
| `224.0.0.2` | All Routers on This Subnet |
| `224.0.0.5` | OSPF AllSPFRouters |
| `224.0.0.6` | OSPF AllDRouters |
| `224.0.0.9` | RIPv2 Routers |
| `224.0.0.10` | EIGRP Routers |
| `224.0.0.13` | All PIM Routers |
| `224.0.0.18` | VRRP |
| `224.0.0.22` | IGMPv3 Routers |

These addresses belong to standard protocols and must not be reused by ordinary applications.

### Link-Local Scope Is Not the Same as TTL 1

Many protocols using this block send packets with:

```text
TTL = 1
```

However, the key rule is not that a device always forces the TTL to 1.

The correct distinction is:

- TTL limits how many Layer 3 hops a packet can traverse;
- The address semantics of `224.0.0.0/24` prevent routers from forwarding the traffic off the local link.

Even a malformed packet sent to `224.0.0.5` with a TTL of 10 is still not supposed to be routed onto another link.

When you see `224.0.0.X`, think:

- Local-link protocol traffic;
- No cross-subnet forwarding;
- Local interface, VLAN, and control-plane troubleshooting;
- Not an address for normal application data.

---

## 5. Internetwork Control Block: `224.0.1.0/24`

The Internetwork Control Block is:

```text
224.0.1.0 - 224.0.1.255
```

Unlike `224.0.0.0/24`, its address semantics do not restrict traffic to one local link.

A historical example is:

```text
224.0.1.1
```

which was assigned to NTP multicast.

However, an address being eligible for routed use does not guarantee reachability.

Actual forwarding still depends on whether the network provides multicast service and applies the required forwarding and security policies.

The key principle is:

> Address semantics define the intended scope; network configuration determines actual reachability.

---

## 6. Source-Specific Multicast Block: `232.0.0.0/8`

The standard IPv4 SSM range is:

```text
232.0.0.0 - 232.255.255.255
```

In SSM, a receiver identifies a specific source and group:

```text
(S,G)
```

For example:

```text
(10.10.10.10, 232.100.1.1)
```

When you see a group in `232/8`, you should immediately think:

- Standard SSM address;
- Receiver identifies the source;
- The service is defined by `(S,G)`;
- No rendezvous point is required for source discovery.

However, the address prefix alone does not:

- Create receiver membership;
- Build multicast forwarding state;
- Guarantee the shortest physical path;
- Reduce per-packet ASIC latency;
- Guarantee lossless delivery.

The address identifies the intended service model. The host and network must still be configured correctly.

This model is especially useful for known and fixed sources, such as financial market-data feeds:

```text
Source IP:      10.10.10.10
Group IP:       232.100.1.1
UDP Port:       12001
Service Model:  SSM
```

---

## 7. GLOP and Documentation Space

### 7.1 GLOP

GLOP uses part of:

```text
233.0.0.0/8
```

The historical allocation method maps a 16-bit ASN into a `/24` block:

```text
233.X.Y.0/24
```

For ASN 64500:

```text
64500 / 256 = 251 remainder 244
```

so the corresponding block is:

```text
233.251.244.0/24
```

GLOP is useful to understand historically, but it is not normally the first choice for modern internal enterprise multicast planning.

---

### 7.2 MCAST-TEST-NET

For documentation and example code, use:

```text
233.252.0.0/24
```

For example:

```text
Source IP:      192.0.2.10
Destination IP: 233.252.0.10
```

This avoids accidentally using a group assigned to a real protocol or production service.

---

## 8. Administratively Scoped Multicast: `239.0.0.0/8`

The Administratively Scoped Multicast block is:

```text
239.0.0.0 - 239.255.255.255
```

It is used for multicast services within an organization or administrative domain.

It is often compared with RFC 1918 private unicast space because both can be reused independently inside isolated networks.

However, they are different types of addresses:

| Comparison | RFC 1918 | `239/8` |
|---|---|---|
| Address type | Private unicast host/interface address | Multicast group address |
| Configured on an interface | Yes | Not as a normal host address |
| Main forwarding model | Unicast routing | Multicast distribution |
| Typical boundary behavior | NAT, proxy, ACL, or tunnel | Multicast boundary, ACL, VRF, or tunnel |
| Reusable in isolated domains | Yes | Yes |

RFC 1918 traffic is not globally routable as native public unicast. Private hosts normally access the public IPv4 Internet through NAT, a proxy, or another gateway mechanism.

Similarly, `239/8` traffic is not intended to be forwarded as native multicast beyond its administrative scope.

Both types of private traffic may still be carried as an inner packet inside a tunnel that crosses the public Internet.

### The Address Does Not Enforce the Boundary

Using `239/8` does not automatically cause every edge router to discard the traffic.

The network must enforce the scope using mechanisms such as:

- Multicast boundaries;
- Group ACLs;
- VRFs;
- Firewall policies;
- Routing policies;
- Network segmentation.

A useful design principle is:

> The address identifies administratively scoped multicast, but the network must enforce the actual scope boundary.

Important subranges include:

```text
239.255.0.0/16
```

for IPv4 Local Scope, and:

```text
239.192.0.0/14
```

for IPv4 Organization Local Scope.

An organization might create a plan such as:

```text
239.192.10.0/24  Market Risk Data
239.192.20.0/24  Internal Monitoring
239.192.30.0/24  Backtesting Feeds
```

The address plan improves organization, but VRFs, ACLs, boundaries, and service ownership still provide the real isolation.

---

## 9. Scope, TTL, and Administrative Boundary

These three concepts are related but not interchangeable.

### TTL

TTL answers:

> How many more routed hops can this packet traverse?

```text
TTL = 4
```

A Layer 2 switch does not decrease the IPv4 TTL during ordinary bridging.

### Address Scope

Address scope answers:

> What propagation range was this address block designed for?

For example, `224.0.0.0/24` is defined for local-link control traffic.

### Administrative Boundary

An administrative boundary answers:

> Where does the actual network stop forwarding this traffic?

For example, `239.192.0.0/14` is intended for internal organizational use, but an actual policy must enforce the boundary at the organization's edge.

| Concept | Question |
|---|---|
| TTL | How many routed hops remain? |
| Address Scope | What propagation range does the address standard define? |
| Administrative Boundary | Where does the network actually block the traffic? |

Do not use TTL as a replacement for a security boundary, and do not assume that selecting `239/8` eliminates the need for filtering.

---

# 10. Why an IPv4 Multicast Group Needs an Ethernet MAC

At Layer 3, multicast traffic uses an IPv4 group address.

At Layer 2, an Ethernet switch still forwards a frame according to its destination MAC address.

Therefore, a packet sent to:

```text
239.1.1.1
```

must be encapsulated with an Ethernet multicast destination:

```text
Destination IP:  239.1.1.1
Destination MAC: 01:00:5e:01:01:01
```

This MAC address is not the unicast MAC of any receiver and is not learned through ARP.

It is calculated directly from the multicast group.

---

## 11. Ethernet Multicast MAC Address Structure

The least significant bit of the first MAC octet is the Individual/Group bit:

```text
0 = Individual address
1 = Group address
```

For example:

```text
00:50:56:aa:bb:cc
```

is a unicast MAC because the I/G bit is 0.

By contrast:

```text
01:00:5e:01:01:01
```

is a multicast MAC because the I/G bit is 1.

IPv4 multicast over Ethernet uses the fixed prefix:

```text
01:00:5E
```

The complete mapped range is:

```text
01:00:5E:00:00:00
-
01:00:5E:7F:FF:FF
```

The most significant bit of the fourth octet is fixed to 0:

```text
01:00:5E:0xxxxxxx:xxxxxxxx:xxxxxxxx
```

Only the final 23 bits are therefore available for IPv4 group information.

---

## 12. IPv4-to-MAC Mapping Rule

An IPv4 multicast address has 28 variable group bits:

```text
┌──────────┬────────────────────────────┐
│   1110   │       Group ID: 28 bits    │
└──────────┴────────────────────────────┘
  4 bits             28 bits
```

The Ethernet multicast MAC can retain only 23 of them.

The lower 23 bits of the IPv4 group are copied into the lower 23 bits of the MAC:

```text
IPv4 Multicast Address:

┌──────────┬─────────────┬────────────────────────┐
│   1110   │ 5 bits lost │   Lowest 23 bits kept  │
└──────────┴─────────────┴────────────────────────┘
  4 bits       5 bits              23 bits


Ethernet Multicast MAC:

┌────────────────────────┬───┬────────────────────────┐
│       01:00:5E          │ 0 │   Lowest 23 IP bits    │
└────────────────────────┴───┴────────────────────────┘
         24 bits          1 bit         23 bits
```

If the group is:

```text
A.B.C.D
```

the mapped MAC is:

```text
01:00:5E:(B & 0x7F):C:D
```

The mapping keeps:

- The lower seven bits of the second IP octet;
- All eight bits of the third octet;
- All eight bits of the fourth octet.

It discards:

- The lower four bits of the first octet;
- The most significant bit of the second octet.

---

## 13. Mapping Examples

### `239.1.1.1`

```text
Second octet: 1
1 & 0x7F = 1
```

Convert `1.1.1` to hexadecimal:

```text
01:01:01
```

Result:

```text
239.1.1.1
→ 01:00:5E:01:01:01
```

### `232.100.1.10`

```text
100 & 0x7F = 100
100 = 0x64
1   = 0x01
10  = 0x0A
```

Result:

```text
232.100.1.10
→ 01:00:5E:64:01:0A
```

### `239.192.10.20`

The second octet is greater than 127, so subtract 128:

```text
192 - 128 = 64
```

Convert to hexadecimal:

```text
64 = 0x40
10 = 0x0A
20 = 0x14
```

Result:

```text
239.192.10.20
→ 01:00:5E:40:0A:14
```

A quick mental method is:

1. Start with `01:00:5E`;
2. Keep only the lower seven bits of the second IP octet;
3. Convert the final three values to hexadecimal.

---

## 14. Why 32 IPv4 Groups Can Map to One MAC

The IPv4 multicast group contains 28 variable bits, but the Ethernet mapping retains only 23:

```text
28 - 23 = 5
```

Five discarded bits create:

```text
2^5 = 32
```

possible IPv4 groups that map to the same Ethernet multicast MAC.

This is known as:

```text
32:1 multicast MAC overlap
```

Two groups collide when their lower 23 bits are identical:

```text
IP1 & 0x7FFFFF == IP2 & 0x7FFFFF
```

In dotted-decimal terms:

- The lower seven bits of the second octet must match;
- The third octet must match;
- The fourth octet must match.

Changes to the first octet do not affect the result.

For example, all of these map to:

```text
01:00:5E:01:01:01
```

```text
224.1.1.1
224.129.1.1
225.1.1.1
225.129.1.1
232.1.1.1
232.129.1.1
239.1.1.1
239.129.1.1
```

The full combination consists of:

```text
16 possible first octets × 2 possible values of the discarded second-octet bit
= 32 groups
```

---

## 15. What MAC Overlap Actually Means

MAC overlap does not mean that the IPv4 groups become identical.

For example:

```text
232.1.1.1
239.1.1.1
```

remain different Layer 3 groups even though both map to:

```text
01:00:5E:01:01:01
```

Their destination IP addresses remain different, and applications can still distinguish them.

MAC overlap does not:

- Change the destination IP;
- Change the UDP port;
- Merge two channels;
- Modify the packet payload.

However, it may cause Layer 2 over-forwarding.

If a switch forwards multicast using only:

```text
VLAN + Destination Multicast MAC
```

then different groups sharing one MAC may also share the same outgoing-port list.

Example:

```text
Receiver A joins 232.1.1.1
Receiver B joins 239.1.1.1
```

Both map to:

```text
01:00:5E:01:01:01
```

A MAC-based implementation may produce:

```text
VLAN 10
01:00:5E:01:01:01
→ Port A, Port B
```

Traffic for either group may then reach both ports.

The receiving host can still inspect the destination IP and discard traffic for groups it did not join, but the unnecessary packets may consume:

- Link bandwidth;
- NIC resources;
- Receive queues;
- Kernel packet-processing capacity;
- Monitoring and capture resources.

This matters most in high-throughput or low-latency environments.

---

## 16. The Practical Impact Depends on the Switch

Not all platforms use the same multicast forwarding key.

Possible implementations include:

```text
VLAN + Multicast MAC
```

```text
VLAN + Group IP
```

or:

```text
VLAN + Source IP + Group IP
```

Therefore, the same MAC overlap may cause over-forwarding on one platform but not on another.

The following command showing an IP group:

```text
show ip igmp snooping groups
```

does not prove that the ASIC uses IP-based forwarding.

A CLI can display control-plane group information while the hardware forwarding table uses another key.

To determine actual behavior, verify:

- Device model;
- ASIC architecture;
- Software version;
- Vendor documentation;
- Hardware forwarding entries;
- Packet behavior on receiver-facing links.

The general principle is:

> Multicast MAC overlap is inherent in the mapping process, but its forwarding impact depends on the switch implementation.

---

## 17. Address-Planning Principles

### 17.1 Compare the Complete Lower 23 Bits

When planning groups in the same VLAN or bridge domain, compare:

```text
Second octet & 0x7F
Third octet
Fourth octet
```

If all three values match, the groups map to the same MAC.

---

### 17.2 Changing the First Octet Does Not Help

These addresses collide:

```text
232.1.1.1
239.1.1.1
```

because the first IP octet does not participate in the mapping.

---

### 17.3 Second Octets That Differ by 128 Collide

These addresses also collide:

```text
239.1.1.1
239.129.1.1
```

because:

```text
1 & 0x7F   = 1
129 & 0x7F = 1
```

There is no universal planning rule based on a fixed increment. The correct rule is to compare the complete lower 23 bits.

---

### 17.4 A Simple Local Planning Method

One practical approach is to fix the first two octets and allocate unique values in the final two:

```text
239.192.1.1
239.192.1.2
239.192.2.1
239.192.2.2
```

These map to:

```text
01:00:5E:40:01:01
01:00:5E:40:01:02
01:00:5E:40:02:01
01:00:5E:40:02:02
```

---

### 17.5 Check Across SSM and Internal Ranges

The following groups belong to different multicast blocks:

```text
232.100.1.1
239.100.1.1
```

but both map to:

```text
01:00:5E:64:01:01
```

Do not perform SSM and internal ASM planning independently without a global overlap check.

---

### 17.6 Not Every Collision Must Be Eliminated Globally

A collision is most relevant when the groups share the same Layer 2 domain.

For example, identical mapped MAC addresses in different VLANs do not normally share the same forwarding entry because the VLAN is part of the lookup context.

Risk depends on:

- Whether groups share one VLAN or bridge domain;
- Platform forwarding behavior;
- Traffic volume;
- Receiver sensitivity;
- Hardware resource limits;
- Mixed-vendor designs;
- Low-latency requirements.

For high-bandwidth or low-latency networks, avoid unnecessary overlap within the same Layer 2 domain whenever practical.

---

## 18. A Small Multicast MAC Audit Tool

The following Python 3 tool accepts one or more IPv4 multicast groups and reports any MAC collisions.

```python
#!/usr/bin/env python3

import ipaddress
import re
from collections import defaultdict


def multicast_ip_to_mac(group_ip):
    ip = ipaddress.IPv4Address(group_ip)

    if not ip.is_multicast:
        raise ValueError(
            "{} is not an IPv4 multicast address".format(group_ip)
        )

    low_23_bits = int(ip) & 0x7FFFFF
    mac_value = 0x01005E000000 | low_23_bits
    mac_hex = "{:012x}".format(mac_value)

    return ":".join(
        mac_hex[index:index + 2]
        for index in range(0, 12, 2)
    )


def collect_groups():
    groups = []

    print("IPv4 Multicast MAC Collision Audit")
    print("----------------------------------")
    print("Enter one or more multicast IP addresses.")
    print("Separate multiple addresses with spaces or commas.")
    print("Press Enter on an empty line to start the audit.\n")

    while True:
        try:
            user_input = input("Multicast IP: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            break

        for address in re.split(r"[\s,]+", user_input):
            if not address:
                continue

            try:
                ip = ipaddress.IPv4Address(address)
            except ipaddress.AddressValueError:
                print("  Skipped: invalid IPv4 address: {}".format(address))
                continue

            if not ip.is_multicast:
                print("  Skipped: not a multicast address: {}".format(address))
                continue

            normalized = str(ip)

            if normalized not in groups:
                groups.append(normalized)

    return groups


def print_report(groups):
    if not groups:
        print("\nNo valid multicast addresses were entered.")
        return

    mapping = defaultdict(list)

    print("\nMulticast IP to MAC Mapping")
    print("-" * 45)

    for group in groups:
        mac = multicast_ip_to_mac(group)
        mapping[mac].append(group)
        print("{:<18} {}".format(group, mac))

    collisions = {
        mac: addresses
        for mac, addresses in mapping.items()
        if len(addresses) > 1
    }

    if not collisions:
        print("\nAudit result: No multicast MAC collisions were found.")
        return

    print("\nAudit result: Multicast MAC collisions were found.")

    for mac, addresses in collisions.items():
        print("\n{}".format(mac))

        for address in addresses:
            print("  - {}".format(address))


if __name__ == "__main__":
    print_report(collect_groups())
```

The tool answers one specific question:

> Which IPv4 multicast groups map to the same Ethernet MAC?

It does not prove that a real switch will over-forward the traffic. That still depends on VLAN placement, platform architecture, and forwarding behavior.

---

## 19. Key Takeaways

- IPv4 multicast uses `224.0.0.0/4`.
- A multicast address can be a destination but not a source address.
- A group address identifies a logical receiver group, not an interface.
- `224.0.0.0/24` is limited to the local link.
- `232.0.0.0/8` is the standard IPv4 SSM range.
- `233.252.0.0/24` is intended for documentation and examples.
- `239.0.0.0/8` is administratively scoped multicast space.
- TTL, address scope, and administrative boundaries are different concepts.
- Ethernet multicast uses the fixed `01:00:5E` prefix for IPv4 mapping.
- Only the lower 23 bits of the IPv4 group are preserved in the MAC.
- Five discarded bits create a 32-to-1 IPv4-group-to-MAC mapping ratio.
- MAC overlap does not make two Layer 3 groups identical.
- On some platforms, overlap may cause Layer 2 over-forwarding.
- Address plans should compare the complete lower 23 bits.
- High-throughput and low-latency environments should avoid unnecessary overlap in the same Layer 2 domain.
- Address planning should record at least the source, group, UDP port, scope, VLAN or VRF, service owner, and redundancy design.

<script src="https://giscus.app/client.js"
        data-repo="Alex-Xushjie/Alex-life"
        data-repo-id="R_kgDOTBXE4w"
        data-category="General"
        data-category-id="DIC_kwDOTBXE484DAIZT"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>