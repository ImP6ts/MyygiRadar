package ee.myygi.radar.domain.model

data class Company(
    val id: String,
    val name: String,
    val category: String = "TELECOM_OR_FINANCIAL",
    val active: Boolean = true
)
