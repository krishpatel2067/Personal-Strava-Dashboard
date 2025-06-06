const file = new File(["hello", "world"], "UploadedTestNoteName.txt", {
    type: "text/plain"
});
console.log(file.size)