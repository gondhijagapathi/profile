document.addEventListener("DOMContentLoaded", () => {
    const outputList = document.getElementById("output");
    const cmdInput = document.getElementById("cmd-input");
    const promptContainer = document.getElementById("prompt-container");
    const terminal = document.getElementById("terminal");

    const state = {
        isBooting: true,
        commandHistory: [],
        historyIndex: -1
    };

    // Use PROFILE_DATA from data.js or fallbacks if missing
    const data = (typeof PROFILE_DATA !== "undefined") ? PROFILE_DATA : {};
    const username = data.username || "guest";
    const hostname = data.hostname || "local";
    const version = data.version || "v1.0.0";

    // Update the HTML prompt to use the custom username/hostname
    document.querySelector(".prompt-user").textContent = username + "@" + hostname;

    const bootSequence = [
        { text: "Initializing boot sequence...", delay: 150 },
        { text: "Loading kernel modules... OK", delay: 100 },
        { text: "Mounting file systems... OK", delay: 100 },
        { text: "Starting network interfaces... OK", delay: 100 },
        { text: `Welcome to JagOS ${version}`, delay: 200 },
        { text: "", delay: 50 },
        { text: "Type 'help' to see available commands.", delay: 150 },
        { text: "", delay: 0 },
    ];

    const commands = {
        help: {
            desc: "List all available commands",
            exec: () => {
                return `Available commands:<br/>
  <span style="color:var(--prompt-dir)">about</span>    - Display information about me<br/>
  <span style="color:var(--prompt-dir)">resume</span>   - View/download my resume<br/>
  <span style="color:var(--prompt-dir)">contact</span>  - Show my contact details and social links<br/>
  <span style="color:var(--prompt-dir)">clear</span>    - Clear the terminal screen<br/>
  <span style="color:var(--prompt-dir)">whoami</span>   - Tells you who you are<br/>
  <span style="color:var(--prompt-dir)">ls</span>       - List directory contents<br/>
  <span style="color:var(--prompt-dir)">date</span>     - Print current date and time<br/>
  <span style="color:var(--prompt-dir)">weather</span>  - Display local weather<br/>
  <span style="color:var(--prompt-dir)">sudo</span>     - Run a command with administrative privileges<br/>
  <span style="color:var(--prompt-user)">hack</span>     - Initiate remote exploitation protocol<br/>
  <span style="color:var(--prompt-dir)">echo</span>     - Print text to terminal`;
            }
        },
        about: {
            desc: "Information about me",
            exec: () => {
                if (!data.about) return "No about info configured.";
                return `<img src="${data.about.imageUrl}" width="150" height="200" alt="Profile Image"><br/>
<br/>
${data.about.title}<br/>
in ${data.about.location}<br/>
<br/>
My favorite code quote: "<span style="color:var(--prompt-user)">${data.about.quote}</span>"`;
            }
        },
        resume: {
            desc: "Download my resume",
            exec: () => {
                if (!data.resumePath) return "No resume configured.";
                window.open(data.resumePath, '_blank');
                return "Opening resume in a new tab...";
            }
        },
        contact: {
            desc: "Contact information",
            exec: () => {
                if (!data.contact) return "No contact info configured.";
                return `Contact me on:<br/>
- <a href="mailto:${data.contact.email}" target="_blank">📧 Email</a><br/>
- <a href="${data.contact.stackoverflow}" target="_blank">📚 StackOverflow</a><br/>
- <a href="${data.contact.github}" target="_blank">📝 Github</a>`;
            }
        },
        whoami: {
            desc: "Print current user",
            exec: async () => {
                const ua = navigator.userAgent;
                let browser = "Guest";
                if (ua.includes("Firefox")) browser = "FirefoxUser";
                else if (ua.includes("Edg/")) browser = "EdgeUser";
                else if (ua.includes("Chrome")) browser = "ChromeUser";
                else if (ua.includes("Safari")) browser = "SafariUser";

                const os = navigator.platform || "UnknownSystem";
                let shockInfo = `User: ${browser}@${os.replace(/\\s+/g, '')}<br/>`;
                shockInfo += `Language: ${navigator.language}<br/>`;
                shockInfo += `Screen: ${window.screen.width}x${window.screen.height}<br/>`;
                if (navigator.hardwareConcurrency) shockInfo += `CPU Cores: ${navigator.hardwareConcurrency}<br/>`;
                if (navigator.deviceMemory) {
                    if (navigator.deviceMemory >= 8) {
                        shockInfo += `Device Memory: 8+ GB RAM (Capped by browser privacy limit)<br/>`;
                    } else {
                        shockInfo += `Device Memory: ~${navigator.deviceMemory}GB RAM<br/>`;
                    }
                }

                if (navigator.getBattery) {
                    try {
                        const battery = await navigator.getBattery();
                        shockInfo += `Battery: ${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})<br/>`;
                    } catch (e) { }
                }

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    const res = await fetch('https://ipinfo.io/json', { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    const data = await res.json();
                    if (data.ip) {
                        shockInfo += `Public IP: <span style="color:var(--prompt-user)">${data.ip}</span><br/>`;
                        shockInfo += `Location: ${data.city}, ${data.region}, ${data.country}<br/>`;
                        if (data.org) shockInfo += `ISP: ${data.org}<br/>`;
                    }
                } catch (e) {
                    console.error("IP lookup failed:", e);
                }
                return shockInfo;
            }
        },
        clear: {
            desc: "Clear screen",
            exec: () => {
                outputList.innerHTML = "";
                return "";
            }
        },
        ls: {
            desc: "List directory contents",
            exec: () => `<span style="color:var(--link-color)">projects/</span>  <span style="color:var(--link-color)">about.txt</span>  <span style="color:var(--link-color)">resume.pdf</span>  <span style="color:#39ff14">data.js</span>  <span style="color:#39ff14">index.html</span>`
        },
        date: {
            desc: "Print current date and time",
            exec: () => new Date().toString()
        },
        echo: {
            desc: "Print text to terminal",
            exec: (args) => {
                args.shift();
                return args.join(" ");
            }
        },
        weather: {
            desc: "Display local weather (requires internet)",
            exec: async () => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4000);
                    const res = await fetch('https://wttr.in/?format=3', { signal: controller.signal });
                    clearTimeout(timeoutId);
                    return await res.text();
                } catch (e) {
                    return "Terminal disconnected from atmospheric station.";
                }
            }
        },
        sudo: {
            desc: "Run a command with administrative privileges",
            exec: () => {
                return `${username} is not in the sudoers file. This incident will be reported.`;
            }
        },
        hack: {
            desc: "Initiate remote exploitation protocol",
            exec: async () => {
                const wait = ms => new Promise(r => setTimeout(r, ms));
                printLine("INITIALIZING REMOTE EXPLOIT...", false);
                await wait(600);
                printLine("BYPASSING MAINFRAME FIREWALL...", false);
                await wait(800);
                printLine("ACCESS GRANTED. TRACING TARGET...", false);
                await wait(600);
                try {
                    const res = await fetch('https://ipinfo.io/json');
                    const data = await res.json();
                    if(data.ip) {
                        printLine(`<span style="color:var(--prompt-user)">TARGET ACQUIRED: ${data.ip} (${data.city})</span>`, true);
                    }
                } catch(e) {
                    printLine(`<span style="color:var(--prompt-user)">TARGET ACQUIRED: localhost</span>`, true);
                }
                await wait(500);

                document.body.classList.add('hacked');
                printLine(`<div style="text-align: center;"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Anonymous_emblem.svg/500px-Anonymous_emblem.svg.png" style="max-width: 200px; filter: drop-shadow(0 0 15px red); margin: 20px 0;"><br/><span style="font-size: 24px; color: red; font-weight: bold; text-shadow: 0 0 10px red;">WE ARE ANONYMOUS. WE ARE LEGION.</span></div>`, true);

                await wait(1800);
                printLine("<span style='color:red'>Extracting keystrokes... 100%</span>", true);
                await wait(800);
                printLine("<span style='color:red'>Uploading local data... Done.</span>", true);
                
                await wait(2500);
                document.body.classList.remove('hacked');
                return "System integrity restored. Connection terminated.";
            }
        }
    };

    function printLine(text, isHtml = false) {
        const div = document.createElement("div");
        if (isHtml) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }
        outputList.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
    }

    function printPrompt(cmd) {
        const promptHtml = `<span class="prompt-prefix"><span class="prompt-user">${username}@${hostname}</span>:<span class="prompt-dir">~</span><span class="prompt-char">$</span></span> ${cmd}`;
        printLine(promptHtml, true);
    }

    async function runBootSequence() {
        for (const step of bootSequence) {
            await new Promise(r => setTimeout(r, step.delay));
            printLine(step.text);
        }

        printPrompt("about");
        await new Promise(r => setTimeout(r, 400));
        printLine(commands.about.exec(), true);

        await new Promise(r => setTimeout(r, 200));
        printLine("<br/>", true);

        state.isBooting = false;
        promptContainer.style.display = "flex";
        cmdInput.focus();
        terminal.scrollTop = terminal.scrollHeight;
    }

    async function executeCommand(cmdString) {
        const trimmed = cmdString.trim();
        if (!trimmed) {
            printPrompt("");
            return;
        }

        printPrompt(trimmed);

        const args = trimmed.split(" ");
        const baseCmd = args[0].toLowerCase();

        if (commands[baseCmd]) {
            const out = await commands[baseCmd].exec(args);
            if (out) printLine(out, true);
        } else {
            printLine(`bash: ${baseCmd}: command not found`);
        }
    }

    cmdInput.addEventListener("keydown", async (e) => {
        if (state.isBooting) return;

        if (e.key === "Enter") {
            const val = cmdInput.value;
            if (val.trim()) {
                state.commandHistory.push(val);
                state.historyIndex = state.commandHistory.length;
            }
            cmdInput.value = "";
            await executeCommand(val);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (state.historyIndex > 0) {
                state.historyIndex--;
                cmdInput.value = state.commandHistory[state.historyIndex];
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (state.historyIndex < state.commandHistory.length - 1) {
                state.historyIndex++;
                cmdInput.value = state.commandHistory[state.historyIndex];
            } else {
                state.historyIndex = state.commandHistory.length;
                cmdInput.value = "";
            }
        }
    });

    // Auto-focus input on click anywhere
    document.addEventListener("click", () => {
        if (!state.isBooting && window.getSelection().toString() === "") {
            cmdInput.focus();
        }
    });

    runBootSequence();
});
