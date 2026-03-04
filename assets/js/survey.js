const COMMUNITIES = {
  STEM: "STEM Innovators",
  ARTS: "Creative Arts Collective",
  SERVICE: "Community Service Leaders",
  GENERAL: "Neighborhood Connectors"
};

function assignCommunity(answers) {
  const { interest, involvement, age } = answers;

  if (interest === "STEM") return COMMUNITIES.STEM;
  if (interest === "Arts") return COMMUNITIES.ARTS;
  if (interest === "Service" || involvement === "Volunteering") {
    return COMMUNITIES.SERVICE;
  }
  return COMMUNITIES.GENERAL;
}

document.addEventListener("DOMContentLoaded", () => {
  //Redirect if not log in
  const user = requireAuth();
  const form = document.getElementById("survey-form");
  const messageEl = document.getElementById("survey-message");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const interest = form.elements["interest"].value;
    const involvement = form.elements["involvement"].value;
    const age = form.elements["age"].value;

    if (!interest || !involvement || !age) {
      messageEl.textContent = "Please answer all questions.";
      messageEl.style.color = "red";
      return;
    }

    const community = assignCommunity({ interest, involvement, age });

    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].survey = { interest, involvement, age };
      users[idx].community = community;
      saveUsers(users);
    }

    messageEl.textContent = `You have been assigned to: ${community}`;
    messageEl.style.color = "#2E7D60";

    setTimeout(() => {
      window.location.href = "profile.html";
    }, 800);
  });
});
