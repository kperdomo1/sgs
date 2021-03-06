<?php
defined('BASEPATH') OR exit('No direct script access allowed');
include (APPPATH. '/libraries/ChromePhp.php');
use Ramsey\Uuid\Uuid;

class NewRequestController extends CI_Controller {

	public function __construct() {
        parent::__construct();
        $this->load->library('session');
		$this->load->model('requestsModel', 'requests');
    }

	public function personalLoan () {
		$this->load->view('templates/dialogs/personalLoan/newRequest');
	}

	public function cashVoucher () {
		$this->load->view('templates/dialogs/cashVoucher/newRequest');
	}

    public function upload() {
		if ($this->session->type == APPLICANT) {
			$result['message'] = 'forbidden';
		} else {
			// Generate a version 4 (random) UUID object
			$uuid4 = Uuid::uuid4();
			$code = $uuid4->toString(); // i.e. 25769c6c-d34d-4bfe-ba98-e0ee856f3e7a
			$uploadfile = DropPath . $_POST['userId'] . '.' .
				$code . '.' . basename($_FILES['file']['name']);
	        move_uploaded_file($_FILES['file']['tmp_name'], $uploadfile);

	        $result['lpath'] = $_POST['userId'] . '.' . $code .
				'.' . basename($_FILES['file']['name']);
		}
		echo json_encode($result);
	}

	/**
	 * Gets a user's availability data (i.e. conditions for creating new request of specific concept). This is:
	 */
	public function getAvailabilityData() {
		$result['message'] = "error";
		if ($this->input->get('userId') != $this->session->id && $this->session->type == APPLICANT) {
			$result['message'] = 'forbidden';
		} else {
			try {
				$result = $this->requests->getAvailabilityData($this->input->get('userId'), $this->input->get('concept'));
				$em = $this->doctrine->em;
				// Get user's phone and email
				$user = $em->find('Entity\User', $this->input->get('userId'));
				$result['userPhone'] = $user->getPhone();
				$result['userEmail'] = $user->getEmail();
				$result['message'] = 'success';
			} catch (Exception $e) {
				$result['message'] = $this->utils->getErrorMsg($e);
			}
		}
		echo json_encode($result);
	}

    public function createRequest() {
		$data = json_decode(file_get_contents('php://input'), true);
		if ($data['userId'] != $this->session->id && $this->session->type != AGENT) {
			// Only agents can create requests for other people
			$result['message'] = 'forbidden';
		} else {
			try {
				// Validate incoming data.
				switch (intval($data['loanType'], 10)) {
					case CASH_VOUCHER:
						$this->requests->validateCashVoucherCreation($data, false);
						break;
					case PERSONAL_LOAN:
						$this->requests->validatePersonalLoanCreation($data, false);
						break;
				}
				$em = $this->doctrine->em;
				// Register History first
				$request = new \Entity\Request();
				$history = new \Entity\History();
				$history->setDate(new DateTime('now', new DateTimeZone('America/Barbados')));
				$history->setUserResponsible($this->users->getUser($this->session->id));
				$history->setTitle($this->utils->getHistoryActionCode('creation'));
				$history->setOrigin($request);
				$request->addHistory($history);
				// Register it's corresponding actions
				$action = new \Entity\HistoryAction();
				$action->setSummary("Estatus de la solicitud: " . RECEIVED . ".");
				$action->setBelongingHistory($history);
				$history->addAction($action);
				$em->persist($action);
				$action = new \Entity\HistoryAction();
				$action->setSummary("Monto solicitado: Bs " . number_format($data['reqAmount'], 2));
				$action->setBelongingHistory($history);
				$history->addAction($action);
				$em->persist($action);
				$action = new \Entity\HistoryAction();
				$action->setSummary("Plazo para pagar: " . $data['due'] . " meses.");
				$action->setBelongingHistory($history);
				$history->addAction($action);
				$em->persist($action);
				$action = new \Entity\HistoryAction();
				$loanTypes = $this->configModel->getLoanTypes();
				$action->setSummary("Tipo de préstamo: " . $loanTypes[$data['loanType']]->DescripcionDelPrestamo);
				$action->setBelongingHistory($history);
				$em->persist($action);
				$history->addAction($action);
				$em->persist($history);
				$request->setStatus(RECEIVED);
				$request->setCreationDate(new DateTime('now', new DateTimeZone('America/Barbados')));
				$request->setRequestedAmount($data['reqAmount']);
				$request->setLoanType($data['loanType']);
				$request->setPaymentDue($data['due']);
				$request->setContactNumber($data['tel']);
				$request->setContactEmail($data['email']);
				$user = $em->find('\Entity\User', $data['userId']);
				$request->setUserOwner($user);
				$user->addRequest($request);
				$em->persist($request);
				if (isset($data['deductions'])) {
					$this->addDeductions($request, $data['deductions'], $history);
				}
				$em->merge($user);
				// Create the new request doc.
				$this->requests->addDocuments($request, $history, $data['docs'], true);
				$em->persist($history);
				$em->flush();
				$result['request'] = $this->utils->reqToArray($request);
				$this->requests->generateRequestDocument($request);
				$result['message'] = "success";
	        } catch (Exception $e) {
				$result['message'] = $this->utils->getErrorMsg($e);
	        }
		}
		echo json_encode($result);
	}

	private function addDeductions ($request, $deductions, $history) {
		try {
			switch ($request->getLoanType()) {
				case PERSONAL_LOAN:
					$this->requests->updateDeductions($request, $deductions, $history);
					break;
			}
		} catch (Exception $e) {
			throw $e;
		}
	}
}
