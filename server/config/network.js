import dns from "node:dns";
import net from "node:net";
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);