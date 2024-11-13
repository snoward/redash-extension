function DASHBOARD_URL(originUrl, dashboardId) { return `${originUrl}/api/dashboards/${dashboardId}` };
function DASHBOARD_ACL_URL(originUrl, dashboardId) { return `${originUrl}/api/dashboards/${dashboardId}/acl` };
function QUERY_ACL_URL(originUrl, queryId) { return `${originUrl}/api/queries/${queryId}/acl` };

async function requestDashboardInfo(originUrl, dashboardId) {
  const resp = await fetch(DASHBOARD_URL(originUrl, dashboardId));
  return await resp.json();
}

async function requestDashboardAccessControlList(originUrl, dashboardId) {
  const resp = await fetch(`${DASHBOARD_ACL_URL(originUrl, dashboardId)}`);
  return await resp.json();
}

function filterWidgetsWithQueries(dashboardInfo) {
  const queries = [];
  for (const widget of dashboardInfo.widgets) {
    const visualization = widget.visualization;
    if (visualization) {
      queries.push(visualization.query.id);
    }
  }
  return queries;
}

async function grantAccess() {
  const url = window.location.href;
  const originUrl = new URL(url).origin;
  const dashboardId = url.split('dashboards/')[1].split('-')[0];
  const dashboardInfo = await requestDashboardInfo(originUrl, dashboardId);
  const dashboardUsers = await requestDashboardAccessControlList(originUrl, dashboardId);
  
  for (const userId of dashboardUsers['modify'].map(user => user.id)) {
    for (const queryId of filterWidgetsWithQueries(dashboardInfo)) {
        await fetch(`${QUERY_ACL_URL(originUrl, queryId)}`, {
          method: 'POST',
          body: JSON.stringify({ access_type: "modify", user_id: userId})
        });
    }
  }
}

function insertButtonWhenModalOpened() {
  const buttonId = "accessButton";

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName !== "DIV") {
            return;
          }
          const title = node.querySelector(".ant-modal-title");
          if (
            !title ||
            !title.childNodes[0] ||
            !title.childNodes[1].innerText.includes('dashboard') ||
            title.childNodes[0].textContent !== "Manage Permissions"
          ) {
            return;
          }
          const parent = node.querySelector(".ant-modal-body");
          if (!parent || parent.querySelector(`#${buttonId}`)) {
            return;
          }

          const container = document.createElement("div");
          container.id = `${buttonId}`;
          container.style.display = "flex";
          container.style.alignItems = "center";

          const button = document.createElement("button");
          button.className = "btn btn-sm hidden-xs btn-default";
          button.style.marginRight = "8px";
          button.textContent = "Grant access to all queries";
          button.addEventListener("click", () => grantAccess());

          container.appendChild(button);

          parent.appendChild(container);
        });
      }
    }
  });

  const config = { childList: true, subtree: true };
  observer.observe(document.body, config);
}

insertButtonWhenModalOpened();
