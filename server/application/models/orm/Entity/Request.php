<?php

namespace Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Request
 *
 * @ORM\Table(name="request")
 * @ORM\Entity(repositoryClass="Entity\RequestRepository")
 */
class Request
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer", precision=0, scale=0, nullable=false, unique=true)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $id;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="creation_date", type="datetime", precision=0, scale=0, nullable=false, unique=false)
     */
    private $creationDate;

    /**
     * @var string
     *
     * @ORM\Column(name="comment", type="string", length=255, precision=0, scale=0, nullable=true, unique=false)
     */
    private $comment;

    /**
     * @var integer
     *
     * @ORM\Column(name="reunion", type="integer", precision=0, scale=0, nullable=true, unique=false)
     */
    private $reunion;

    /**
     * @var float
     *
     * @ORM\Column(name="requested_amount", type="float", precision=0, scale=0, nullable=false, unique=false)
     */
    private $requestedAmount;

    /**
     * @var float
     *
     * @ORM\Column(name="approved_amount", type="float", precision=0, scale=0, nullable=true, unique=false)
     */
    private $approvedAmount;

    /**
     * @var float
     *
     * @ORM\Column(name="paid_amount", type="float", precision=0, scale=0, nullable=true, unique=false)
     */
    private $paidAmount;

    /**
     * @var string
     *
     * @ORM\Column(name="status", type="string", length=255, precision=0, scale=0, nullable=false, unique=false)
     */
    private $status;

    /**
     * @var integer
     *
     * @ORM\Column(name="payment_due", type="smallint", precision=2, scale=0, nullable=false, unique=false)
     */
    private $paymentDue;

    /**
     * @var integer
     *
     * @ORM\Column(name="loan_type", type="smallint", precision=2, scale=0, nullable=false, unique=false)
     */
    private $loanType;

    /**
     * @var string
     *
     * @ORM\Column(name="contact_numb", type="string", length=15, precision=0, scale=0, nullable=false, unique=false)
     */
    private $contactNumber;

    /**
     * @var string
     *
     * @ORM\Column(name="contact_email", type="string", length=255, precision=0, scale=0, nullable=false, unique=false)
     */
    private $contactEmail;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="validation_date", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $validationDate;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="registration_date", type="datetime", precision=0, scale=0, nullable=true, unique=false)
     */
    private $registrationDate;

    /**
     * @var \Doctrine\Common\Collections\Collection
     *
     * @ORM\OneToMany(targetEntity="Entity\Document", mappedBy="belongingRequest")
     */
    private $documents;

    /**
     * @var \Doctrine\Common\Collections\Collection
     *
     * @ORM\OneToMany(targetEntity="Entity\History", mappedBy="origin")
     */
    private $history;

    /**
     * @var \Entity\User
     *
     * @ORM\ManyToOne(targetEntity="Entity\User", inversedBy="requests")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="user_id", referencedColumnName="id", nullable=false, onDelete="CASCADE")
     * })
     */
    private $userOwner;

    /**
     * @var \Doctrine\Common\Collections\Collection
     *
     * @ORM\OneToMany(targetEntity="Entity\AdditionalDeduction", mappedBy="request")
     */
    private $additionalDeductions;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->documents = new \Doctrine\Common\Collections\ArrayCollection();
        $this->history = new \Doctrine\Common\Collections\ArrayCollection();
        $this->additionalDeductions = new \Doctrine\Common\Collections\ArrayCollection();
    }

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set creationDate
     *
     * @param \DateTime $creationDate
     * @return Request
     */
    public function setCreationDate($creationDate)
    {
        $this->creationDate = $creationDate;

        return $this;
    }

    /**
     * Get creationDate
     *
     * @return \DateTime
     */
    public function getCreationDate()
    {
        return $this->creationDate;
    }

    /**
     * Set comment
     *
     * @param string $comment
     * @return Request
     */
    public function setComment($comment)
    {
        $this->comment = $comment;

        return $this;
    }

    /**
     * Get comment
     *
     * @return string
     */
    public function getComment()
    {
        return $this->comment;
    }

    /**
     * Set reunion
     *
     * @param integer $reunion
     * @return Request
     */
    public function setReunion($reunion)
    {
        $this->reunion = $reunion;

        return $this;
    }

    /**
     * Get reunion
     *
     * @return integer
     */
    public function getReunion()
    {
        return $this->reunion;
    }

    /**
     * Set requestedAmount
     *
     * @param float $requestedAmount
     * @return Request
     */
    public function setRequestedAmount($requestedAmount)
    {
        $this->requestedAmount = $requestedAmount;

        return $this;
    }

    /**
     * Get requestedAmount
     *
     * @return float
     */
    public function getRequestedAmount()
    {
        return $this->requestedAmount;
    }

    /**
     * Set approvedAmount
     *
     * @param float $approvedAmount
     * @return Request
     */
    public function setApprovedAmount($approvedAmount)
    {
        $this->approvedAmount = $approvedAmount;

        return $this;
    }

    /**
     * Get approvedAmount
     *
     * @return float
     */
    public function getApprovedAmount()
    {
        return $this->approvedAmount;
    }

    /**
     * Set paidAmount
     *
     * @param float $paidAmount
     * @return Request
     */
    public function setPaidAmount($paidAmount)
    {
        $this->paidAmount = $paidAmount;

        return $this;
    }

    /**
     * Get paidAmount
     *
     * @return float
     */
    public function getPaidAmount()
    {
        return $this->paidAmount;
    }

    /**
     * Set status
     *
     * @param string $status
     * @return Request
     */
    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Get status
     *
     * @return string
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * Set paymentDue
     *
     * @param integer $paymentDue
     * @return Request
     */
    public function setPaymentDue($paymentDue)
    {
        $this->paymentDue = $paymentDue;

        return $this;
    }

    /**
     * Get paymentDue
     *
     * @return integer
     */
    public function getPaymentDue()
    {
        return $this->paymentDue;
    }

    /**
     * Set loanType
     *
     * @param integer $loanType
     * @return Request
     */
    public function setLoanType($loanType)
    {
        $this->loanType = $loanType;

        return $this;
    }

    /**
     * Get loanType
     *
     * @return integer
     */
    public function getLoanType()
    {
        return $this->loanType;
    }

    /**
     * Set contactNumber
     *
     * @param string $contactNumber
     * @return Request
     */
    public function setContactNumber($contactNumber)
    {
        $this->contactNumber = $contactNumber;

        return $this;
    }

    /**
     * Get contactNumber
     *
     * @return string
     */
    public function getContactNumber()
    {
        return $this->contactNumber;
    }

    /**
     * Set contactEmail
     *
     * @param string $contactEmail
     * @return Request
     */
    public function setContactEmail($contactEmail)
    {
        $this->contactEmail = $contactEmail;

        return $this;
    }

    /**
     * Get contactEmail
     *
     * @return string
     */
    public function getContactEmail()
    {
        return $this->contactEmail;
    }

    /**
     * Set validationDate
     *
     * @param \DateTime $validationDate
     * @return Request
     */
    public function setValidationDate($validationDate)
    {
        $this->validationDate = $validationDate;

        return $this;
    }

    /**
     * Get validationDate
     *
     * @return \DateTime
     */
    public function getValidationDate()
    {
        return $this->validationDate;
    }

    /**
     * Set registrationDate
     *
     * @param \DateTime $registrationDate
     * @return Request
     */
    public function setRegistrationDate($registrationDate)
    {
        $this->registrationDate = $registrationDate;

        return $this;
    }

    /**
     * Get registrationDate
     *
     * @return \DateTime
     */
    public function getRegistrationDate()
    {
        return $this->registrationDate;
    }

    /**
     * Add documents
     *
     * @param \Entity\Document $documents
     * @return Request
     */
    public function addDocument(\Entity\Document $documents)
    {
        $this->documents[] = $documents;

        return $this;
    }

    /**
     * Remove documents
     *
     * @param \Entity\Document $documents
     */
    public function removeDocument(\Entity\Document $documents)
    {
        $this->documents->removeElement($documents);
    }

    /**
     * Get documents
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getDocuments()
    {
        return $this->documents;
    }

    /**
     * Add history
     *
     * @param \Entity\History $history
     * @return Request
     */
    public function addHistory(\Entity\History $history)
    {
        $this->history[] = $history;

        return $this;
    }

    /**
     * Remove history
     *
     * @param \Entity\History $history
     */
    public function removeHistory(\Entity\History $history)
    {
        $this->history->removeElement($history);
    }

    /**
     * Get history
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getHistory()
    {
        return $this->history;
    }

    /**
     * Set userOwner
     *
     * @param \Entity\User $userOwner
     * @return Request
     */
    public function setUserOwner(\Entity\User $userOwner)
    {
        $this->userOwner = $userOwner;

        return $this;
    }

    /**
     * Get userOwner
     *
     * @return \Entity\User
     */
    public function getUserOwner()
    {
        return $this->userOwner;
    }

    /**
     * Add additionalDeductions
     *
     * @param \Entity\AdditionalDeduction $additionalDeductions
     * @return Request
     */
    public function addAdditionalDeduction(\Entity\AdditionalDeduction $additionalDeductions)
    {
        $this->additionalDeductions[] = $additionalDeductions;

        return $this;
    }

    /**
     * Remove additionalDeductions
     *
     * @param \Entity\AdditionalDeduction $additionalDeductions
     */
    public function removeAdditionalDeduction(\Entity\AdditionalDeduction $additionalDeductions)
    {
        $this->additionalDeductions->removeElement($additionalDeductions);
    }

    /**
     * Get additionalDeductions
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getAdditionalDeductions()
    {
        return $this->additionalDeductions;
    }
}
