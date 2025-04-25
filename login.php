<?php
// Kết nối CSDL
$conn = new mysqli('localhost', 'root', '', 'edu_web');
$password = password_hash('matkhau', PASSWORD_DEFAULT);
// Kiểm tra kết nối
if ($conn->connect_error) {
    die("Kết nối thất bại: " . $conn->connect_error);
}

// Xử lý khi form được gửi
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Truy vấn kiểm tra thông tin người dùng
    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Kiểm tra mật khẩu
        if (password_verify($password, $user['password'])) {
            // Đăng nhập thành công
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            header('Location: dashboard.php'); // Chuyển hướng đến trang dashboard
            exit();
        } else {
            echo "Sai mật khẩu!";
        }
    } else {
        echo "Email không tồn tại!";
    }
}
?>