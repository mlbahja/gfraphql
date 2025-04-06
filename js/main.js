function Logout() {
    localStorage.removeItem('jwt')
    window.location.href = "login.html"
}

function intrastatus() {
    const afterGet = localStorage.getItem('jwt');
    if (!afterGet) {
        window.location.href = "login.html"
    }

    fetch("https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${afterGet}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: `{
                user {
                    firstName
                    lastName
                    auditRatio
                    transactions(
                        where: { type: { _like: "skill_%" } }
                        order_by: { amount: desc }
                    ) {
                        id
                        type
                        amount
                    }
                }
                transaction(
                    where: {
                        _and: [
                            { type: { _eq: "xp" } }
                            { eventId: { _eq: 41 } }
                        ]
                    }
                ) {
                    type
                    amount
                    path
                    createdAt
                    eventId
                    object {
                        type
                        name
                    }
                }
            }`
        })
    })
        .then(response => {
            if (response.ok) {
                return response.json()
            }
        })
        .then(data => {
            if (data && typeof data === "object" && "errors" in data) {
                window.location.href = "login.html";
                console.log(data);
                return
            }

            document.getElementById('first_name').textContent = data.data.user[0].firstName;
            document.getElementById('last_name').textContent = data.data.user[0].lastName;

            const auditRatio = data.data.user[0].auditRatio.toFixed(1);
            document.getElementById('audits').textContent = `${auditRatio}`;

            const xpTransaction = data.data.transaction.reduce((accu, curr) => accu + curr.amount, 0);
            const xpFormatted = (xpTransaction * 0.001).toFixed(0);
            document.getElementById('xp').textContent = `${xpFormatted} Kb`;

            xpGraph('containerId', {
                transaction: data.data.transaction
            });

            function createBarChart(skills, containerId) {
                const container = document.getElementById(containerId);
                container.innerHTML = "";

                const width = 400;
                const height = 200;
                const barWidth = 60;
                const gap = 10;

                let maxAmount = Math.max(...skills.map(skill => skill.amount));

                let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", width);
                svg.setAttribute("height", height);

                let tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
                tooltip.setAttribute("visibility", "hidden");
                tooltip.setAttribute("text-anchor", "middle");
                tooltip.setAttribute("fill", "#fff");
                tooltip.setAttribute("font-size", "12");
                tooltip.setAttribute("font-weight", "bold");

                skills.forEach((skill, index) => {
                    let barHeight = (skill.amount / maxAmount) * (height - 20);

                    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("x", index * (barWidth + gap));
                    rect.setAttribute("y", height - barHeight);
                    rect.setAttribute("width", barWidth);
                    rect.setAttribute("height", barHeight);
                    rect.setAttribute("fill", "rgb(26, 26, 26)"); // Bar color update

                    let amountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    amountText.setAttribute("x", index * (barWidth + gap) + barWidth / 2);
                    amountText.setAttribute("y", height - barHeight - 5);
                    amountText.setAttribute("text-anchor", "middle");
                    amountText.setAttribute("fill", "#d6e6d7");
                    amountText.textContent = skill.amount;

                    rect.addEventListener("mouseover", function () {
                        tooltip.textContent = skill.type;

                        tooltip.setAttribute("x", index * (barWidth + gap) + barWidth / 2);
                        tooltip.setAttribute("y", Math.max(150, height - barHeight - 50));
                        tooltip.setAttribute("visibility", "visible");
                    });

                    rect.addEventListener("mouseout", function () {
                        tooltip.setAttribute("visibility", "hidden");
                    });

                    svg.appendChild(rect);
                    svg.appendChild(amountText);
                });

                svg.appendChild(tooltip);
                container.innerHTML = "<h1> Skills </h1><br>";
                container.appendChild(svg);
            }

            const skillTypes = [
                'skill_prog',
                'skill_go',
                'skill_front-end',
                'skill_back-end',
                'skill_js'
            ];
            let skills = {}

            data.data.user[0].transactions.forEach(transaction => {
                if (skillTypes.includes(transaction.type)) {
                    if (!skills[transaction.type] || transaction.amount > skills[transaction.type].amount) {
                        skills[transaction.type] = transaction;
                    }
                }
            });

            skills = Object.values(skills);

            createBarChart(skills, "section4");

        })
        .catch(error => {
            console.error("Error:", error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem('jwt')
    if (!token) {
        window.location.href = 'index.html'
    }
})

function xpGraph(containerId, data) {
    const container = document.getElementById(containerId);
    const margin = { top: 50, right: 60, bottom: 40, left: 60 };
    let tooltip = null;

    function processData(data) {
        let cumulativeXP = 0;
        return data.transaction.map(tx => {
            cumulativeXP += tx.amount;
            return {
                amount: tx.amount,
                totalXP: cumulativeXP,
                project: tx.object.name,
                date: new Date(tx.createdAt)
            };
        });
    }

    function createScales(processedData, width, height) {
        const dateRange = [
            processedData[0].date,
            processedData[processedData.length - 1].date
        ];

        const xpRange = [0, processedData[processedData.length - 1].totalXP];

        return {
            xScale: (x) => {
                const range = dateRange[1] - dateRange[0];
                return ((x - dateRange[0]) / range) *
                    (width - margin.left - margin.right) +
                    margin.left;
            },
            yScale: (y) => {
                return height -
                    (y / xpRange[1]) *
                    (height - margin.top - margin.bottom) -
                    margin.bottom;
            }
        };
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `   
            position: absolute;
            display: none;
            background: #333;
            color: #fff;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-family: Arial, sans-serif;
            box-shadow: 0px 4px 12px #d6e6d7;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 1000;
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }

    function createPoint(svg, x, y, pointData, tooltip) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#ff9800"); // Orange point color

        circle.addEventListener('mouseover', (e) => {
            circle.setAttribute("r", "6");
            circle.setAttribute("fill", "#d6e6d7");

            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                Project: ${pointData.project}<br>
                XP: ${pointData.totalXP.toLocaleString()}<br>
                Date: ${pointData.date.toLocaleDateString()}
            `;

            const rect = circle.getBoundingClientRect();
            tooltip.style.left = `${rect.left + window.scrollX}px`;
            tooltip.style.top = `${rect.top + window.scrollY - 70}px`;
        });

        circle.addEventListener('mouseout', () => {
            circle.setAttribute("r", "4");
            circle.setAttribute("fill", "#ff9800"); // Revert to orange
            tooltip.style.display = 'none';
        });

        svg.appendChild(circle);
    }

    function render() {

        container.innerHTML = '';

        const width = container.getBoundingClientRect().width;
        const height = container.getBoundingClientRect().height || 200;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.style.backgroundColor = "#d6e6d7";

        container.appendChild(svg);

        const processedData = processData(data);
        const { xScale, yScale } = createScales(processedData, width, height);

        if (!tooltip) {
            tooltip = createTooltip();
        }

        const pathData = processedData.map((point, index) => {
            const x = xScale(point.date);
            const y = yScale(point.totalXP);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("stroke", "#00bcd4"); // Cyan line color
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        svg.appendChild(path);

        processedData.forEach(point => {
            const x = xScale(point.date);
            const y = yScale(point.totalXP);
            createPoint(svg, x, y, point, tooltip);
        });
    }

    render();

    return {
        update: (newData) => {
            data = newData;
            render();
        }
    };
}

intrastatus();
