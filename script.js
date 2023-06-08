// Kích thước canvas tối đa
const maxHeight = 600, maxWidth = 800;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var img = context.getImageData(0, 0, canvas.width, canvas.height);
// Ảnh gốc
var orgImg = null;
// Tên file gốc
var orgName;
// Lịch sử chỉnh sửa (dùng để undo - hoàn tác)
var editHis = [];
// Lịch sử hoàn tác (dùng để redo - lặp lại)
var undoHis = [];


//Xử lý chuyển màu cho các buttom
{
    // Lấy danh sách các button cần xử lý
    const buttons = document.querySelectorAll('.customBtn-control, .function-btn, .customBtn-control-reset');

    // Thêm sự kiện click vào từng button
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Xóa màu cố định của tất cả các button
            buttons.forEach(btn => {
                btn.classList.remove('selected');
            });

            // Thêm màu cố định cho button được chọn
            button.classList.add('selected');
        });
    });
}

// CÁC NÚT ĐIỀU KHIỂN
{
    // Kéo thả để tải ảnh lên
    {
        var dropArea = document.getElementById('dropArea');
        dropArea.addEventListener('dragover', preventDefault);
        dropArea.addEventListener('drop', handleDrop);

        // Chặn sự kiện mặc định là mở tab mới để hiện ảnh
        function preventDefault(e) {
            e.preventDefault();
        }

        function handleDrop(e) {
            e.preventDefault();
            // Lấy ảnh từ sự kiện kéo và thả
            var file = e.dataTransfer.files[0];
            let fileType = file.type;
            orgName = file.name;

            let validType = ['image/jpeg', 'image/jpg', 'image/png'];

            if (validType.includes(fileType)) {
                let fileReader = new FileReader();
                fileReader.onload = function () {
                    let fileURL = fileReader.result;
                    let img = new Image();

                    img.onload = function () {
                        var width = img.width;
                        var height = img.height;

                        // Tính toán kích thước mới dựa trên maxWidth và maxHeight
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }

                        // Vẽ ảnh lên canvas
                        canvas.width = width;
                        canvas.height = height;
                        context.drawImage(img, 0, 0, width, height);
                        dropArea.style.display = "none";
                        canvas.style.display = "block";

                        // Đặt trạng thái gốc cho ảnh
                        orgImg = context.getImageData(0, 0, canvas.width, canvas.height);
                        editHis = [orgImg];
                        redoHis = [];
                    };
                    img.src = fileURL;
                }
                fileReader.readAsDataURL(file);
            }
            else {
                alert('Chỉ hỗ trợ tải ảnh có định dạng .jpeg, .jpg, .png');
            }
        }
    }

    // Duyệt đường dẫn tải ảnh lên
    {
        var uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.addEventListener('change', function (e) {
            var file = e.target.files[0];
            var reader = new FileReader();
            orgName = file.name;
            // orgName = uploadBtn.files[0].name;
            reader.onload = function (event) {
                let img = new Image();
                img.onload = function () {
                    var width = img.width;
                    var height = img.height;

                    // Tính toán kích thước mới dựa trên maxWidth và maxHeight
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }

                    // Vẽ ảnh lên canvas
                    canvas.width = width;
                    canvas.height = height;
                    context.drawImage(img, 0, 0, width, height);
                    dropArea.style.display = "none";
                    canvas.style.display = "block";

                    // Đặt trạng thái gốc cho ảnh
                    orgImg = context.getImageData(0, 0, canvas.width, canvas.height);
                    editHis = [orgImg];
                    redoHis = [];
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Tải ảnh về máy
    {
        var downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener("click", function () {
            const dataURL = canvas.toDataURL();
            const a = document.createElement("a");
            a.href = dataURL;

            var splitName = orgName.split('.');
            const editName = splitName[0] + "-edited." + splitName[1];
            a.download = editName;
            a.click();
        });
    }

    // Hoàn tác 
    {
        var undoBtn = document.getElementById('undoBtn');
        undoBtn.addEventListener('click', function () {
            if (editHis.length > 1) {
                var currImg = editHis.pop();
                undoHis.push(currImg);
                var prevImg = editHis[editHis.length - 1];
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Kiểm tra kích thước ảnh prevImg với kích thước canvas hiện tại
                if (prevImg.width !== canvas.width || prevImg.height !== canvas.height) {
                    // Cập nhật kích thước canvas
                    canvas.width = prevImg.width;
                    canvas.height = prevImg.height;
                }

                context.putImageData(prevImg, 0, 0);
            }
        });
    }

    // Lặp lại
    {
        var redoBtn = document.getElementById('redoBtn');
        redoBtn.addEventListener('click', function () {
            if (undoHis.length != 0) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                var nextImg = undoHis.pop();
                editHis.push(nextImg);
                context.putImageData(nextImg, 0, 0);
            }
        });
    }

    // Khôi phục gốc
    {
        var resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', function () {
            if (editHis.length > 1) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Kiểm tra kích thước ảnh prevImg với kích thước canvas hiện tại
                if (orgImg.width !== canvas.width || orgImg.height !== canvas.height) {
                    // Cập nhật kích thước canvas
                    canvas.width = orgImg.width;
                    canvas.height = orgImg.height;
                }
                context.putImageData(orgImg, 0, 0);
                editHis = [orgImg];
                undoHis = [];
            }
        });
    }
}

// CÁC NÚT CHỨC NĂNG
{
    // Làm trơn
    {
        // Lấy phần tử thanh trượt làm trơn bằng cách sử dụng ID của nó
        var blurSlider = document.getElementById('blurSlider');

        // Thêm một bộ lắng nghe sự kiện cho sự kiện input của thanh trượt làm trơn
        blurSlider.addEventListener('input', function () {
            // Lấy giá trị của thanh trượt làm trơn dưới dạng số
            var value = Number(blurSlider.value);

            // Lấy dữ liệu của mục lịch sử chỉnh sửa cuối cùng
            var data = editHis[editHis.length - 1].data;

            // Tạo một mảng để lưu trữ dữ liệu sau khi làm trơn
            var resData = [];

            // Lấy chiều rộng và chiều cao của canvas
            var width = canvas.width;
            var height = canvas.height;

            // Duyệt qua dữ liệu từng pixel
            for (let i = 0; i < data.length; i += 4) {
                var avgR = 0, avgG = 0, avgB = 0;
                var count = 0;
                // Tính toán trên một vùng nhỏ hơn để làm trơn
                for (let x = -value; x <= value; x++) {
                    for (let y = -value; y <= value; y++) {
                        // Tính toán vị trí offset trong mảng dữ liệu dựa trên x và y
                        var offsetX = x + y * width;
                        var index = i + (offsetX * 4);

                        // Kiểm tra xem offset có nằm trong phạm vi của dữ liệu không vượt quá chiều rộng và chiều cao
                        if (offsetX >= 0 && offsetX < width && index >= 0 && index < data.length) {
                            // Cộng dồn các giá trị màu R, G, B
                            avgR += data[index];
                            avgG += data[index + 1];
                            avgB += data[index + 2];
                            count++;
                        }
                    }
                }
                // Gán giá trị trung bình cho pixel hiện tại
                resData[i] = avgR / count;
                resData[i + 1] = avgG / count;
                resData[i + 2] = avgB / count;

                //Giá trị kênh alpha (độ trong suốt) không thay đổi
                resData[i + 3] = data[i + 3];
            }

            // Tạo đối tượng ImageData mới với dữ liệu đã làm trơn, chiều rộng và chiều cao của canvas
            var resImgData = new ImageData(new Uint8ClampedArray(resData), width, height);

            // Đặt dữ liệu hình ảnh đã làm trơn lên canvas
            context.putImageData(resImgData, 0, 0);
        });
    }

    // Chiếu sáng
    {
        var lightSlider = document.getElementById('lightSlider');
        lightSlider.addEventListener('change', function () {
            var data = editHis[editHis.length - 1].data.slice();
            var value = Number(lightSlider.value);

            for (let i = 0; i < data.length; i += 4) {
                for (let k = 0; k < 3; k++)
                    data[i + k] += value;
            }
            var resImgData = new ImageData(data, canvas.width, canvas.height);
            context.putImageData(resImgData, 0, 0);
        });

    }

    // Tương phản
    {
        var contrastSlider = document.getElementById('contrastSlider');
        contrastSlider.addEventListener('change', function () {
            // Sao chép dữ liệu pixel ban đầu
            var data = editHis[editHis.length - 1].data.slice();
            var value = Number(contrastSlider.value);

            // Điều chỉnh tương phản
            for (let i = 0; i < data.length; i += 4) {
                for (let k = 0; k < 3; k++)
                    data[i + k] *= value;
            }

            // Tạo hình ảnh mới từ dữ liệu điều chỉnh
            var resImgData = new ImageData(data, canvas.width, canvas.height);
            context.putImageData(resImgData, 0, 0);
        });
    }

    // Lưu lại các điều chỉnh
    function saveAdjustments() {
        blurSlider.value = 0;
        lightSlider.value = 0;
        contrastSlider.value = 1;
        editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
    }

    // Làm xám
    {
        // Hàm chuyển đổi sang hình ảnh xám
        function GrayScale(data, width, height) {
            const grayscale = new Uint8ClampedArray(width * height * 4);
            for (let i = 0; i < data.length; i += 4) {
                avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                for (let k = 0; k < 3; k++)
                    grayscale[i + k] = avg;
                grayscale[i + 3] = 255;
            }
            return grayscale;
        }

        // Xử lý sự kiện khi nút "grayBtn" được nhấn
        var grayBtn = document.getElementById('grayBtn');
        grayBtn.addEventListener('click', function () {
            // Lấy dữ liệu pixel từ canvas
            img = context.getImageData(0, 0, canvas.width, canvas.height);
            // Chuyển đổi sang hình ảnh xám
            var gray = GrayScale(img.data, img.width, img.height);
            // Tạo đối tượng ImageData mới từ dữ liệu xám
            var grayImgData = new ImageData(gray, canvas.width, canvas.height);
            // Cập nhật hình ảnh trên canvas
            context.putImageData(grayImgData, 0, 0);
            // Lưu trạng thái xám vào lịch sử chỉnh sửa
            editHis.push(grayImgData);
        });
    }

    // Phát hiện biên cạnh
    {
        function DetectEdges(img_data) {
            const data = img_data.data;
            const width = img_data.width;
            const height = img_data.height;

            // Chuyển sang ảnh xám
            const gray = GrayScale(data, width, height);

            // Áp dụng bộ lọc Sobel để phát hiện biên cạnh
            const result = new Uint8ClampedArray(width * height * 4);
            const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
            const step_y = width * 4;

            for (let x = 1; x < width - 1; x++) {
                for (let y = 1; y < height - 1; y++) {
                    let sumX = 0;
                    let sumY = 0;
                    // Nhân tích chập với bộ lọc
                    for (let kx = -1; kx <= 1; kx++) {
                        for (let ky = -1; ky <= 1; ky++) {
                            const row = y + ky;
                            const col = x + kx;
                            let idx = row * step_y + col * 4;
                            sumX += gray[idx] * sobelX[(kx + 1) * 3 + ky + 1];
                            sumY += gray[idx] * sobelY[(kx + 1) * 3 + ky + 1];
                        }
                    }
                    // Lưu kết quả vào result
                    const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
                    let idx = y * step_y + x * 4;
                    for (let k = 0; k < 3; k++)
                        result[idx + k] = magnitude;
                    result[idx + 3] = 255;
                }
            }
            return result;
        }
        var edgeBtn = document.getElementById('edgeBtn');
        edgeBtn.addEventListener("click", function () {
            img = context.getImageData(0, 0, canvas.width, canvas.height);
            var edgeImageData = new ImageData(DetectEdges(img), canvas.width, canvas.height);
            context.putImageData(edgeImageData, 0, 0);
            editHis.push(edgeImageData);
        });
    }

    // VẼ 
    {
        // Thêm
        var isDrawing;
        var drawBtn = document.getElementById("drawBtn");
        var colorInput = document.getElementById("drawColor");
        var thicknessInput = document.getElementById("thickSelect");

        drawBtn.addEventListener("click", function () {
            canvas.removeEventListener("mousedown", startErasing);
            canvas.addEventListener("mousedown", startDrawing);
            canvas.addEventListener("mousemove", draw);
            canvas.addEventListener("mouseup", stopDrawing);
        });

        function startDrawing(e) {
            if (e.button === 0) {
                isDrawing = true;
                context.beginPath();
                context.moveTo(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            }
        }
        function draw(e) {
            if (!isDrawing) return;
            context.strokeStyle = colorInput.value;
            context.lineWidth = thicknessInput.options[thicknessInput.selectedIndex].value;
            context.lineTo(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            context.stroke();
        }
        function stopDrawing(e) {
            if (e.button === 0) {
                isDrawing = false;
            }
        }

        // Xóa
        var isErasing;
        var eraseBtn = document.getElementById("eraseBtn");

        eraseBtn.addEventListener("click", function () {
            canvas.removeEventListener("mousedown", startDrawing);
            canvas.addEventListener("mousedown", startErasing);
            canvas.addEventListener("mousemove", erase);
            canvas.addEventListener("mouseup", stopErasing);
        });

        function startErasing(e) {
            if (e.button === 0)
                isErasing = true;
        }
        function erase(e) {
            if (!isErasing) return;

            // Tọa độ chuột hiện tại
            var mouseX = e.pageX - canvas.offsetLeft;
            var mouseY = e.pageY - canvas.offsetTop;

            // Lấy dữ liệu ảnh hiện tại
            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            var pixelIndex = (mouseY * canvas.width + mouseX) * 4;

            // Ảnh trước khi thêm nét vẽ
            var prevImgData = editHis[editHis.length - 1];

            // Xóa nét vẽ trong vùng bán kính của cục tẩy
            var eraserSize = parseInt(thicknessInput.value);
            for (var i = -eraserSize; i <= eraserSize; i++) {
                for (var j = -eraserSize; j <= eraserSize; j++) {
                    var x = mouseX + i;
                    var y = mouseY + j;

                    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                        var pixelIndex = (y * canvas.width + x) * 4;
                        for (let i = 0; i < 3; i++)
                            imageData.data[pixelIndex + i] = prevImgData.data[pixelIndex + i];
                    }
                }
            }
            // Vẽ lại ảnh lên canvas
            context.putImageData(imageData, 0, 0);
        }
        function stopErasing(e) {
            if (e.button === 0) {
                isErasing = false;
            }
        }

        // Lưu
        function saveDrawing() {
            editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
        }
    }

    // VĂN BẢN
    {
        var textElements = [];
        var selectedTextIndex = -1;
        var isDragging = false;
        var isResizing = false;
        var resizeIndex = -1;
        var prevX;
        var prevY;
        var textScale = 1;

        function drawTextElements() {
            // Khôi phục ảnh trước khi thêm text
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.putImageData(editHis[editHis.length - 1], 0, 0);

            // Vẽ lại các text và khung chọn mới
            textElements.forEach(function (textElement, index) {
                context.font = textElement.fontSize * textScale + 'px Arial';
                context.fillStyle = textElement.color;
                context.fillText(textElement.text, textElement.x, textElement.y);

                if (index === selectedTextIndex) {
                    context.strokeStyle = 'red';
                    context.lineWidth = 2;
                    context.strokeRect(
                        textElement.x,
                        textElement.y - textElement.fontSize * textScale,
                        context.measureText(textElement.text).width,
                        textElement.fontSize * textScale
                    );
                }
            });
        }

        function addText() {
            var text = document.getElementById('text');
            var textColor = document.getElementById('textColor').value;
            var fontSize = parseInt(document.getElementById('fontSize').value);
            if (text.value === "") return;

            var textElement = {
                text: text.value,
                color: textColor,
                fontSize: fontSize,
                x: canvas.width / 2,
                y: canvas.height / 2
            };
            textElements.push(textElement);

            // Cập nhật
            selectedTextIndex = textElements.length - 1;
            text.value = "";
            drawTextElements();
        }

        function deleteText() {
            if (selectedTextIndex !== -1) {
                textElements.splice(selectedTextIndex, 1);
                selectedTextIndex = -1;
                drawTextElements();
            }
        }

        function updateTextScale() {
            var newTextScale = parseFloat(document.getElementById('fontSize').value) / 20;

            // Cập nhật kích thước chữ được chọn
            if (selectedTextIndex !== -1) {
                var selectedTextElement = textElements[selectedTextIndex];
                var deltaScale = newTextScale / selectedTextScale;
                selectedTextScale = newTextScale;
                selectedTextElement.fontSize *= deltaScale;
            }

            drawTextElements();
        }

        function onMouseDownText(e) {
            var x = e.offsetX;
            var y = e.offsetY;

            isDragging = false;
            isResizing = false;
            resizeIndex = -1;

            isInsideText = false; // Reset trạng thái

            // Kiểm tra xem chuột có nằm trong vùng chữ không
            textElements.forEach(function (textElement, index) {
                var textWidth = context.measureText(textElement.text).width;
                var textHeight = textElement.fontSize * textScale;
                if (
                    x >= textElement.x &&
                    x <= textElement.x + textWidth &&
                    y >= textElement.y - textHeight &&
                    y <= textElement.y
                ) {
                    selectedTextIndex = index;
                    isDragging = true;
                    startX = x;
                    startY = y;
                    isInsideText = true;
                }
            });

            if (!isInsideText) {
                selectedTextIndex = -1;
            }

            drawTextElements();
        }

        function handleText() {
            // Thêm chữ mới
            addText();

            canvas.addEventListener('mousedown', onMouseDownText);

            canvas.addEventListener('mousemove', function (e) {
                var x = e.offsetX;
                var y = e.offsetY;

                if (isDragging) {
                    var deltaX = x - startX;
                    var deltaY = y - startY;

                    // Kiểm tra nếu văn bản đã di chuyển đi
                    if (deltaX !== 0 || deltaY !== 0) {
                        // Xóa chữ tại vị trí ban đầu
                        context.clearRect(
                            textElements[selectedTextIndex].x,
                            textElements[selectedTextIndex].y - textElements[selectedTextIndex].fontSize * textScale,
                            context.measureText(textElements[selectedTextIndex].text).width,
                            textElements[selectedTextIndex].fontSize * textScale
                        );
                    }

                    textElements[selectedTextIndex].x += deltaX;
                    textElements[selectedTextIndex].y += deltaY;

                    startX = x;
                    startY = y;

                    drawTextElements();
                }
            });

            canvas.addEventListener('mouseup', function () {
                isDragging = false;
            });

            canvas.addEventListener('mouseleave', function () {
                isDragging = false;
            });
        }

        function saveText() {
            if (text != '') {
                selectedTextIndex = -1;
                drawTextElements();
                textElements = [];
                editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
            }
            canvas.removeEventListener('mousedown', onMouseDownText);
        }
    }

    // Xoay
    {
        function RotateImage() {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            let { width, height, data } = imageData;

            const rotateData = new Uint8ClampedArray(width * height * 4);

            // Xoay 90 độ
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const sourceIndex = (y * width + x) * 4;
                    const targetIndex =
                        (x * height + (height - y - 1)) * 4;

                    rotateData[targetIndex] = data[sourceIndex];
                    rotateData[targetIndex + 1] = data[sourceIndex + 1];
                    rotateData[targetIndex + 2] = data[sourceIndex + 2];
                    rotateData[targetIndex + 3] = data[sourceIndex + 3];
                }
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = height;
            canvas.height = width;
            var resImgData = new ImageData(rotateData, canvas.width, canvas.height);
            context.putImageData(resImgData, 0, 0);
        }

        // Bắt sự kiện khi nhấn vào nút "Xoay ảnh"
        var rotateBtn = document.getElementById("rotateBtn");
        rotateBtn.addEventListener("click", function () {
            RotateImage();
        });
    }

    // Cắt
    {
        var cropRect = { x: 0, y: 0, width: 0, height: 0 };
        var isCropping = false;
        var cropRectVisible = false;
        var isMouseMoving = false;
        var tempImg = null;

        var cropBtn = document.getElementById('cropBtn');
        cropBtn.addEventListener('click', function () {
            isCropping = !isCropping;
            if (isCropping) {
                // Hiện con trỏ chuột để vẽ khung cắt
                canvas.style.cursor = "crosshair";
                // Xử lý cắt ảnh theo khung
                canvas.addEventListener('mousedown', onMouseDown);
            }
        });

        function onMouseDown(e) {
            if (isCropping) {
                cropRect.x = e.clientX - canvas.getBoundingClientRect().left;
                cropRect.y = e.clientY - canvas.getBoundingClientRect().top;

                canvas.addEventListener('mousemove', onMouseMove);
                canvas.addEventListener('mouseup', onMouseUp);

                cropRectVisible = true;
                tempImg = new Image();
                tempImg.src = canvas.toDataURL(); // Lưu ảnh gốc vào biến tạm
                isMouseMoving = true;

            }
        }
        function onMouseMove(e) {
            if (isMouseMoving) {
                var currentX = e.clientX - canvas.getBoundingClientRect().left;
                var currentY = e.clientY - canvas.getBoundingClientRect().top;
                cropRect.width = currentX - cropRect.x;
                cropRect.height = currentY - cropRect.y;
                context.clearRect(0, 0, canvas.width, canvas.height); // Xóa canvas

                context.drawImage(tempImg, 0, 0); // Vẽ lại ảnh gốc từ biến tạm

                context.strokeStyle = 'red';
                context.lineWidth = 2;
                context.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
            }
        }
        function onMouseUp(e) {
            if (cropRectVisible) {
                var currentX = e.clientX - canvas.getBoundingClientRect().left;
                var currentY = e.clientY - canvas.getBoundingClientRect().top;
                cropRect.width = currentX - cropRect.x;
                cropRect.height = currentY - cropRect.y;

                context.clearRect(0, 0, canvas.width, canvas.height); // Xóa canvas

                context.drawImage(tempImg, 0, 0); // Vẽ lại ảnh gốc từ biến tạm

                var centerX = cropRect.x + cropRect.width / 2;
                var centerY = cropRect.y + cropRect.height / 2;
                cropRect.x = centerX - cropRect.width / 2;
                cropRect.y = centerY - cropRect.height / 2;

                context.strokeStyle = 'red';
                context.lineWidth = 2;
                context.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

                // Cắt ảnh theo khung
                if (cropRect.width > 0 && cropRect.height > 0) {
                    var croppedCanvas = document.createElement('canvas');
                    var croppedContext = croppedCanvas.getContext('2d');
                    croppedCanvas.width = cropRect.width;
                    croppedCanvas.height = cropRect.height;
                    croppedContext.drawImage(tempImg, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);

                    // Xóa canvas
                    context.clearRect(0, 0, canvas.width, canvas.height);

                    // Cập nhật lại kích thước canvas
                    canvas.width = cropRect.width;
                    canvas.height = cropRect.height;

                    // Vẽ ảnh đã cắt lên canvas
                    context.drawImage(croppedCanvas, 0, 0);

                    // Kết thúc sự kiện cắt ảnh
                    canvas.removeEventListener('mousedown', onMouseDown);
                    isCroppirng = false;
                    // Ẩn con trỏ chuột
                    canvas.style.cursor = "default";
                    editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
                }

                canvas.removeEventListener('mousemove', onMouseMove);
                canvas.removeEventListener('mouseup', onMouseUp);

                cropRectVisible = false;
                isMouseMoving = false;
            }
        }
    }

    // Đối xứng
    {
        function FlipImage() {
            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            var flippedData = context.createImageData(imageData);

            for (var y = 0; y < canvas.height; y++) {
                for (var x = 0; x < canvas.width; x++) {
                    var sourceIndex = (y * canvas.width + x) * 4;
                    var targetIndex = (y * canvas.width + (canvas.width - x - 1)) * 4;

                    flippedData.data[targetIndex] = imageData.data[sourceIndex];
                    flippedData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
                    flippedData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
                    flippedData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
                }
            }

            context.putImageData(flippedData, 0, 0);
        }

        var flipBtn = document.getElementById("flipBtn");
        flipBtn.addEventListener("click", function () {
            FlipImage();
        });
    }
}