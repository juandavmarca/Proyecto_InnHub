  <?php 

     header('Access-Control-Allow-Origin: *');
 header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
 header('Access-Control-Allow-Headers: Content-Type, Authorization');  
     header("Content-Type: application/json"); 
     require_once "../config/database.php"; 
      
     // Obtener JSON enviado desde React 
     $data = json_decode(file_get_contents("php://input"), true); 
      
     // Validaciones backend 
     if (empty($data['nombre'])) { 
         echo json_encode([ 
            "success" => false, 
             "message" => "El nombre es obligatorio" 
         ]); 
         exit; 
    } 
      
     if (!empty($data['email']) && !filter_var($data['email'], 
FILTER_VALIDATE_EMAIL)) { 
        echo json_encode([ 
             "success" => false, 
             "message" => "Email no válido" 
         ]); 
         exit; 
     } 
      
     $sql = "INSERT INTO clientes (documento,nombre,apellido,tipo_documento,telefono,email,ciudad_re ) 
             VALUES (:documento,:nombre,:apellido,:tipo_documento,:telefono, :email, :ciudad_re)"; 
      
     $stmt = $pdo->prepare($sql); 
     $stmt->execute([ 
          ":documento" => $data['documento'],
         ":nombre" => $data['nombre'], 
         ":apellido" => $data['apellido'], 
        ":tipo_documento" => $data['tipo_documento'] , 
        ":telefono" => $data['telefono'], 
        ":email" => $data['email'], 
        ":ciudad_re" => $data['ciudad_re']
     ]); 
     
    echo json_encode([ 
         "success" => true, 
         "message" => "Cliente creado correctamente" 
     ]); 