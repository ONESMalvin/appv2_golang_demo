
//console.log("test", window, document);
const sections = document.body.querySelectorAll("section");
window.ONES = SDK.ONES;
Array.prototype.forEach.call(sections, function (section) {
  const button = section.querySelector("button");
  const textarea = section.querySelector("textarea");
  button.addEventListener("click", function () {
    try {
      const fn = new Function(
        `return function() { return ${textarea.value}}`
      );
      Promise.resolve()
        .then(function () {
          return fn()();
        })
        .then(function (value) {
          console.log("test", "invoke", value);
        })
        .catch(function (error) {
          console.log("test", "error", error);
        });
    } catch (error) {
      console.log("test", "error", error);
    }
  });
});
