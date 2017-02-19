<?php
defined('BASEPATH') OR exit('No direct script access allowed');
include (APPPATH. '/libraries/ChromePhp.php');
/**
 * Created by PhpStorm.
 * User: Kristopher
 * Date: 1/17/2017
 * Time: 11:41 PM
 */
class ConfigController extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->library('session');
    }

    public function index() {
        if ($this->session->type != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->view('templates/systemConfig');
        }
    }

    /** Requests' status configuration **/

    public function getStatuses() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->model('configModel');
            echo $this->configModel->getStatuses();
        }
    }

    public function getStatusesForConfig() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->model('configModel');
            echo $this->configModel->getStatusesForConfig();
        }
    }

    public function saveStatuses() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->model('configModel');
            echo $this->configModel->saveStatuses();
        }
    }

    /** Max. requested amount configuration **/
    public function getMaxReqAmount() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            try {
                $this->load->model('configModel');
                $result['maxAmount'] = $this->configModel->getMaxReqAmount();
                $result['message'] = 'success';
            } catch (Exception $e) {
                \ChromePhp::log($e);
                $result['message'] = $this->utils->getErrorMsg($e);
            }
            echo json_encode($result);
        }
    }

    /** Min. requested amount configuration **/
    public function getMinReqAmount() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            try {
                $this->load->model('configModel');
                $result['minAmount'] = $this->configModel->getMinReqAmount();
                $result['message'] = 'success';
            } catch (Exception $e) {
                \ChromePhp::log($e);
                $result['message'] = $this->utils->getErrorMsg($e);
            }
            echo json_encode($result);
        }
    }

    /**
     * Sets both min. and max. request amount.
     */
    public function setReqAmount() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->model('configModel');
            echo $this->configModel->setReqAmount();
        }
    }

    /** Requests month span for applying to same type of loan configuration **/

    public function getRequestsSpan() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->model('configModel');
            echo $this->configModel->getRequestsSpan();
        }
    }



    // Updates the month requests span, required to applying to same type of loan.
    public function updateRequestsSpan() {
        if ($_SESSION['type'] != MANAGER) {
            $this->load->view('errors/index.html');
        } else {
            $this->load->model('configModel');
            echo $this->configModel->updateRequestsSpan();
        }
    }
}
