<?php
defined('BASEPATH') OR exit('No direct script access allowed');
include (APPPATH. '/libraries/ChromePhp.php');

class LoginController extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('session');
    }

    public function index() {
        $this->load->view('login');
    }

    public function authenticate() {
        $data = json_decode($this->input->raw_input_stream, true);
        $result['message'] = 'Error';
       try {
           $em = $this->doctrine->em;
           $user = $em->find('\Entity\User', $data['id']);
           if($user != null) {
               // User in out database. See if passwords match & allow access.
               $result = $this->authenticateUser($user, $data);
           } else {
               // Look for user in ipapedi database.
               $this->load->model('userModel', 'users');
               $oldUser = $this->users->findIpapediUser($data['id']);
               if ($oldUser == null) {
                   $result['message'] = "La cédula ingresada no se encuentra registrada";
               } else {
                   $result = $this->authenticateIpapediUser($oldUser, $data);
               }
           }

       }catch(Exception $e){
           $result['message'] = $this->utils->getErrorMsg($e);
       }

       echo json_encode($result);
    }

    private function authenticateUser($user, $data) {
        try {
            if($user->getPassword() == $data['password']) {
                if (trim($user->getStatus()) === "ACTIVO") {
                    $result['type'] = $user->getType();
                    $result['name'] = $user->getFirstName();
                    $result['lastName'] = $user->getLastName();

                    $dataSession = array(
                        "id" => $data['id'],
                        "name" => $user->getFirstName(),
                        "lastName" =>  $user->getLastName(),
                        "type" => $user->getType(),
                        "logged" => true,
                    );
                    $this->session->set_userdata($dataSession);
                    $result['message'] = "success";
                } else {
                    $result['message'] = "Usuario INACTIVO. Por favor contacte a un administrador.";
                }
            } else {
                $result['message'] = "Contraseña incorrecta";
            }
            return $result;
        } catch (Exception $e) {
            throw $e;
        }
    }

    private function authenticateIpapediUser($oldUser, $data) {
        try {
            if ($oldUser->contrasena != $data['password']) {
                $result['message'] = "Contraseña incorrecta";
            } else {
                if (trim($oldUser->estado) == "ACTIVO") {
                    $nameParts = explode(" ", $oldUser->nombre);
                    $data['firstName'] = $nameParts[0];
                    array_shift($nameParts);
                    $data['lastName'] = implode(" ", $nameParts);
                    $data['status'] = $oldUser->estado;
                    $data['type'] = APPLICANT;
                    $this->users->createUser($data);

                    $result['type'] = APPLICANT;
                    $result['name'] = $data['firstName'];
                    $result['lastName'] = $data['lastName'];
                    $dataSession = array(
                        "id" => $data['id'],
                        "name" => $data['firstName'],
                        "lastName" =>  $data['lastName'],
                        "type" => APPLICANT,
                        "logged" => true,
                    );
                    $this->session->set_userdata($dataSession);

                    $result['message'] = "success";
                } else {
                    $result['message'] = "Usuario INACTIVO. Por favor contacte a un administrador.";
                }
                return $result;
            }
        } catch (Exception $e) {
            throw $e;
        }
    }

    public function logout() {
        $this->session->sess_destroy();
    }

    public function updateSession () {
        $data = json_decode(file_get_contents('php://input'), true);
        $dataSession = array(
            "id" => $_SESSION['id'],
            "name" => $_SESSION['name'],
            "lastName" =>  $_SESSION['lastName'],
            "type" => $data['newType'],
            "logged" => true,
        );
        // Applicant must NEVER be allowed to upgrade it's session.
        if ($_SESSION['type'] == AGENT && $data['newType'] == APPLICANT) {
            $this->session->set_userdata($dataSession);
        } else if ($_SESSION['type'] == MANAGER && $data['newType'] == APPLICANT) {
            $this->session->set_userdata($dataSession);
        } else {
            $this->load->view('errors/index.html');
        }
    }
}
