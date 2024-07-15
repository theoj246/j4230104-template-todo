const deleteForms = document.querySelectorAll(".delete-form");

for (const deleteForm of deleteForms) {
  deleteForm.onsubmit = (e) => {
    if (!window.confirm("本当に削除しますか？")) {
      e.preventDefault();
    }
  };
}

const userForm = document.querySelector(".user-form");

userForm.onsubmit = (e) => {
  if (!window.confirm("本当にユーザーを追加しますか？")) {
    e.preventDefault();
  }
};

