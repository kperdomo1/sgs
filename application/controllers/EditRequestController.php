<?php
defined('BASEPATH') OR exit('No direct script access allowed');
include (APPPATH. '/libraries/ChromePhp.php');

class EditRequestController extends CI_Controller {
	public function __construct() {
        parent::__construct();
        $this->load->library('session');
    }

	public function index() {
		if ($_SESSION['type'] != AGENT) {
			$this->load->view('errors/index.html');
		} else {
			$this->load->view('templates/editRequest');
		}
	}

	public function editionDialog() {
		if ($_SESSION['type'] != AGENT) {
			$this->load->view('errors/index.html');
		} else {
			$this->load->view('templates/editDocDescription');
		}
	}

	public function emailEditionDialog() {
		if ($_SESSION['type'] != APPLICANT) {
			$this->load->view('errors/index.html');
		} else {
			$this->load->view('templates/editEmail');
		}
	}

	public function updateRequest() {
		if ($_SESSION['type'] != AGENT) {
			$this->load->view('errors/index.html');
		} else {
			$data = json_decode(file_get_contents('php://input'), true);
			try {
				$em = $this->doctrine->em;
				// Update request
				$request = $em->find('\Entity\Request', $data['id']);
				$this->load->model('requestsModel', 'requests');
				if (!$this->requests->isRequestValidated($request) || $this->requests->isRequestClosed($request)) {
					// request must be validated and not yet closed.
					throw new Exception('Esta solicitud no puede ser modificada.');
				} else {
					// Register History
					$history = new \Entity\History();
					$history->setDate(new DateTime('now', new DateTimeZone('America/Barbados')));
					$history->setUserResponsible($this->users->getUser($this->session->id));
					$history->setTitle($this->utils->getHistoryActionCode('update'));
					$history->setOrigin($request);
					$request->addHistory($history);
					$changes = '';
					// Register it's corresponding actions
					if (isset($data['comment']) && $request->getComment() !== $data['comment']) {
						$action = new \Entity\HistoryAction();
						$action->setSummary("Comentario acerca de la solicitud.");
						$action->setDetail("Comentario realizado: " . $data['comment']);
						$changes = $changes . '<li>Comentario realizado: ' . $data['comment'] . '</li>';
						$action->setBelongingHistory($history);
						$history->addAction($action);
						$em->persist($action);
					}
					$em->persist($history);
					$request->setStatus($data['status']);
					if (isset($data['comment'])) {
						$request->setComment($data['comment']);
					}
					$em->merge($request);
					$this->load->model('requestsModel', 'requests');
					$changes = $changes . $this->requests->addDocuments($request, $history, $data['newDocs']);
					$em->persist($history);
					$this->load->model('emailModel', 'email');
					$this->email->sendRequestUpdateEmail($request->getId(), $changes);
					$em->flush();
					$result['message'] = "success";
				}
			} catch (Exception $e) {
				$result['message'] = $this->utils->getErrorMsg($e);
			}

			echo json_encode($result);
		}
	}

	public function editRequest() {
		$data = json_decode(file_get_contents('php://input'), true);
		if ($data['userId'] != $_SESSION['id'] && $_SESSION['type'] != AGENT) {
			// Only agents can edit requests for other people
			$this->load->view('errors/index.html');
		} else {
			try {
				$em = $this->doctrine->em;
				$this->load->model('requestsModel', 'requests');
				$this->load->model('configModel');
				$maxAmount = $this->configModel->getMaxReqAmount();
				$minAmount = $this->configModel->getMinReqAmount();
				$terms = REQUESTS_TERMS;
				$loanTypes = LOAN_TYPES;
				if ($this->requests->getSpanLeft($data['userId'], $data['loanType']) > 0) {
					// Span between requests of same type not yet through.
					$span = $em->getRepository('\Entity\Config')->findOneBy(array('key' => 'SPAN'))->getValue();
					$result['message'] = "No ha" . ($span == 1 ? "" : "n") .
										 " transcurrido al menos " . $span . ($span == 1 ? " mes " : " meses ") .
										 "desde su última otorgación de préstamo del tipo: " .
										 $this->utils->mapLoanType($data['loanType']);
				} else if ($data['reqAmount'] < $minAmount || $data['reqAmount'] > $maxAmount) {
					$result['message'] = 'Monto solicitado no válido.';
				} else if (!in_array($data['due'], $terms)) {
					$result['message'] = 'Plazo de pago no válido.';
				} else if (!in_array($data['loanType'], $loanTypes)) {
					$result['message'] = 'Tipo de préstamo inválido.';
				} else {
					// Update request
					$request = $em->find('\Entity\Request', $data['rid']);
					if ($request->getValidationDate()) {
						$result['message'] = 'Información de solicitud ya validada.';
					} else {
						// Register History
						$history = new \Entity\History();
						$history->setDate(new DateTime('now', new DateTimeZone('America/Barbados')));
						$history->setUserResponsible($this->users->getUser($this->session->id));
						$history->setTitle($this->utils->getHistoryActionCode('modification'));
						$history->setOrigin($request);
						$request->addHistory($history);
						// Register it's corresponding actions
						if ($request->getRequestedAmount() != $data['reqAmount']) {
							$action = new \Entity\HistoryAction();
							$action->setSummary("Monto solicitado cambiado.");
							$action->setDetail("Cambiado de Bs " . number_format($request->getRequestedAmount(), 2) .
											   " a Bs " . number_format($data['reqAmount'], 2));
							$action->setBelongingHistory($history);
							$request->setRequestedAmount($data['reqAmount']);
							$history->addAction($action);
							$em->persist($action);
						}
						if ($request->getLoanType() != $data['loanType']) {
							$action = new \Entity\HistoryAction();
							$action->setSummary("Tipo de préstamo cambiado.");
							$action->setDetail("Cambiado de " . $this->utils->mapLoanType($request->getLoanType()) .
											   " a " . $this->utils->mapLoanType($data['loanType']));
							$action->setBelongingHistory($history);
							$request->setLoanType($data['loanType']);
							$history->addAction($action);
							$em->persist($action);
						}
						if ($request->getPaymentDue() != $data['due']) {
							$action = new \Entity\HistoryAction();
							$action->setSummary("Plazo para pagar cambiado.");
							$action->setDetail("Cambiado de " . $request->getPaymentDue() .
											   " meses a " . $data['due'] . " meses");
							$action->setBelongingHistory($history);
							$request->setPaymentDue($data['due']);
							$history->addAction($action);
							$em->persist($action);
						}
						if ($request->getContactNumber() != $data['tel']) {
							$action = new \Entity\HistoryAction();
							$action->setSummary("Número celular cambiado.");
							$action->setDetail("Cambiado de " . $request->getContactNumber() .
											   " a " . $data['tel']);
							$action->setBelongingHistory($history);
							$request->setContactNumber($data['tel']);
							$history->addAction($action);
							$em->persist($action);
						}
						if ($request->getContactEmail() != $data['email']) {
							$action = new \Entity\HistoryAction();
							$action->setSummary("Correo electrónico cambiado.");
							$action->setDetail("Cambiado de  " . $request->getContactEmail() .
											   " a " . $data['email']);
							$action->setBelongingHistory($history);
							$request->setContactEmail($data['email']);
							$history->addAction($action);
							$em->persist($action);
						}
						// This function will be called if at least one field was edited, so
						// we can register History without any previous validation.
						$em->persist($history);
						$em->merge($request);
						$this->load->model('requestsModel', 'requests');
						$this->requests->generateRequestDocument($request);
						$this->sendValidation($request->getId());
						$em->flush();
						$result['message'] = "success";
					}
				}
			} catch (Exception $e) {
				$result['message'] = $this->utils->getErrorMsg($e);
			}

			echo json_encode($result);
		}
	}

	public function updateDocDescription() {
		if ($_SESSION['type'] != AGENT) {
			$this->load->view('errors/index.html');
		} else {
			$data = json_decode(file_get_contents('php://input'), true);
			try {
				$em = $this->doctrine->em;
				$document = $em->find('\Entity\Document', $data['id']);
				$request = $document->getBelongingRequest();
				$this->load->model('requestsModel', 'requests');
				if (!$this->requests->isRequestValidated($request) || $this->requests->isRequestClosed($request)) {
					// request must be validated and not yet closed.
					throw new Exception('Esta solicitud no puede ser modificada.');
				} else {
					// Register History
					if ($document->getDescription() != $data['description']) {
						$history = new \Entity\History();
						$history->setDate(new DateTime('now', new DateTimeZone('America/Barbados')));
						$history->setUserResponsible($this->users->getUser($this->session->id));
						$history->setTitle($this->utils->getHistoryActionCode('update'));
						$request = $document->getBelongingRequest();
						$history->setOrigin($request);
						$request->addHistory($history);
						$em->merge($request);
						// Register it's corresponding action
						$action = new \Entity\HistoryAction();
						$action->setSummary("Descripción del documento '" . $document->getName() . "' actualizada.");
						$action->setDetail("Nueva descripción: " . $data['description']);
						$changes = "<li>Descripción del document '" . $document->getName() . "' actualizada. " .
								   "Nueva descripción: " . $data['description'] . "</li>";
						$action->setBelongingHistory($history);
						$history->addAction($action);
						$em->persist($action);
						$em->persist($history);
						// Update doc description
						$document->setDescription($data['description']);
						$em->merge($document);
						$this->load->model('emailModel', 'email');
						$this->email->sendRequestUpdateEmail($request->getId(), $changes);
						$em->flush();
					}
					$result['message'] = "success";
				}
			} catch (Exception $e) {
				$result['message'] = $this->utils->getErrorMsg($e);
			}

			echo json_encode($result);
		}
	}

	public function updateEmail() {
		if ($_SESSION['type'] != APPLICANT) {
			$this->load->view('errors/index.html');
		} else {
			$data = json_decode(file_get_contents('php://input'), true);
			try {
				$em = $this->doctrine->em;
				// Update request
				$request = $em->find('\Entity\Request', $data['reqId']);
				if ($request->getValidationDate()) {
					$result['message'] = 'Información de solicitud ya validada.';
				} else {
					$request->setContactEmail($data['newAddress']);
					// Register History
					$history = new \Entity\History();
					$history->setDate(new DateTime('now', new DateTimeZone('America/Barbados')));
					$history->setUserResponsible($this->users->getUser($this->session->id));
					// Register it's corresponding actions
					$history->setTitle($this->utils->getHistoryActionCode('modification'));
					$history->setOrigin($request);
					$action = new \Entity\HistoryAction();
					$action->setSummary("Cambio de correo electrónico.");
					$action->setDetail("Nuevo correo electrónico: " . $data['newAddress']);
					$action->setBelongingHistory($history);
					$history->addAction($action);
					$em->persist($action);
					$em->persist($history);
					$em->merge($request);
					$em->flush();
					$em->clear();
					$this->load->model('requestsModel', 'requests');
					$this->requests->generateRequestDocument($request);
					$result['message'] = "success";
				}
			} catch (Exception $e) {
				$result['message'] = $this->utils->getErrorMsg($e);
			}

			echo json_encode($result);
		}
	}

	private function sendValidation($reqId) {
		try {
			$this->load->model('emailModel', 'email');
			$this->email->sendNewRequestEmail($reqId);
			$this->load->model('historyModel', 'history');
			$this->history->registerValidationResend($reqId);
		} catch (Exception $e) {
			throw $e;
		}
	}
}
