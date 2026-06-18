-- phpMyAdmin SQL Dump
-- version 4.6.6deb5
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 13, 2026 at 09:13 AM
-- Server version: 5.7.30-0ubuntu0.18.04.1
-- PHP Version: 7.2.24-0ubuntu0.18.04.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `oppi_innovation`
--

-- --------------------------------------------------------

--
-- Table structure for table `allowed_domains`
--

CREATE TABLE `allowed_domains` (
  `id` int(11) NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `allowed_domains`
--

INSERT INTO `allowed_domains` (`id`, `domain`, `is_active`) VALUES
(1, 'xyz.com', 1),
(2, 'oppi.com', 1),
(3, 'oppi.com', 1),
(4, 'xyz.com', 1),
(5, 'gmail.com', 1);

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('DRAFT','SUBMITTED','UNDER_VALIDATOR_REVIEW','VALIDATOR_APPROVED','VALIDATOR_REJECTED','UNDER_JURY_REVIEW','JURY_APPROVED','JURY_REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'DRAFT',
  `validator_id` int(11) DEFAULT NULL,
  `jury_id` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `validator_action_at` datetime DEFAULT NULL,
  `jury_action_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `user_id`, `status`, `validator_id`, `jury_id`, `submitted_at`, `validator_action_at`, `jury_action_at`, `created_at`) VALUES
(1, 18, 'UNDER_JURY_REVIEW', 3, 4, '2026-06-09 07:05:06', '2026-06-09 07:07:27', '2026-06-09 07:08:33', '2026-06-09 07:03:19'),
(2, 19, 'UNDER_JURY_REVIEW', 3, NULL, '2026-06-09 07:36:08', '2026-06-09 07:36:21', NULL, '2026-06-09 07:34:29');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, NULL, 'REGISTER', 'User', 1, NULL, '::1', '2026-05-01 10:57:00'),
(2, NULL, 'LOGIN', 'User', 1, NULL, '::1', '2026-05-01 10:57:20'),
(3, NULL, 'CREATE_APP', 'Application', 1, NULL, '::1', '2026-05-01 10:57:21'),
(4, NULL, 'LOGIN', 'User', 1, NULL, '::1', '2026-05-01 10:57:47'),
(5, NULL, 'SUBMIT_APP', 'Application', 1, NULL, '::1', '2026-05-01 10:57:48'),
(6, 2, 'LOGIN', 'User', 2, NULL, '::1', '2026-05-01 10:59:10'),
(7, 2, 'VALIDATOR_APPROVE', 'Application', 1, NULL, '::1', '2026-05-01 10:59:11'),
(8, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-05-01 10:59:20'),
(9, 4, 'JURY_APPROVE', 'Application', 1, NULL, '::1', '2026-05-01 10:59:21'),
(10, NULL, 'REGISTER', 'User', 11, NULL, '::1', '2026-05-01 18:43:58'),
(11, NULL, 'LOGIN', 'User', 11, NULL, '::1', '2026-05-01 18:44:07'),
(12, NULL, 'LOGIN', 'User', 11, NULL, '::1', '2026-05-01 18:46:00'),
(13, NULL, 'CREATE_APP', 'Application', 2, NULL, '::1', '2026-05-01 18:47:50'),
(14, NULL, 'LOGIN', 'User', 11, NULL, '::1', '2026-05-01 18:48:05'),
(15, NULL, 'LOGIN', 'User', 11, NULL, '::1', '2026-05-01 18:52:27'),
(16, NULL, 'SUBMIT_APP', 'Application', 2, NULL, '::1', '2026-05-01 18:53:56'),
(17, NULL, 'LOGIN', 'User', 11, NULL, '::1', '2026-05-01 18:54:12'),
(18, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey4paji@xyz.com', '::1', '2026-05-01 18:58:07'),
(19, NULL, 'REGISTER', 'User', 12, NULL, '::1', '2026-05-01 18:59:02'),
(20, NULL, 'CREATE_APP', 'Application', 3, NULL, '::1', '2026-05-01 18:59:03'),
(21, NULL, 'CREATE_APP', 'Application', 4, NULL, '::1', '2026-05-01 18:59:03'),
(22, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey4@gmail.com', '::1', '2026-05-01 19:00:28'),
(23, NULL, 'LOGIN', 'User', 12, NULL, '::1', '2026-05-01 19:00:33'),
(24, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey@oppi.com', '::1', '2026-05-01 19:03:50'),
(25, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey@oppi.com', '::1', '2026-05-01 19:04:25'),
(26, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey@oppi.com', '::1', '2026-05-01 19:04:35'),
(27, 2, 'LOGIN', 'User', 2, NULL, '::1', '2026-05-01 19:05:10'),
(28, 2, 'CREATE_APP', 'Application', 5, NULL, '::1', '2026-05-01 19:05:11'),
(29, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey@oppi.com', '::1', '2026-05-02 05:19:03'),
(30, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-05-02 05:19:23'),
(31, 2, 'LOGIN', 'User', 2, NULL, '::1', '2026-05-02 05:19:52'),
(32, 2, 'LOGIN', 'User', 2, NULL, '::1', '2026-05-02 06:05:11'),
(33, NULL, 'REGISTER', 'User', 13, NULL, '::1', '2026-05-02 06:19:11'),
(34, NULL, 'CREATE_APP', 'Application', 6, NULL, '::1', '2026-05-02 06:19:12'),
(35, NULL, 'CREATE_APP', 'Application', 7, NULL, '::1', '2026-05-02 06:19:12'),
(36, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: shrey5test@xyz.com', '::1', '2026-05-02 06:19:30'),
(37, NULL, 'LOGIN', 'User', 13, NULL, '::1', '2026-05-02 06:19:36'),
(38, NULL, 'LOGIN', 'User', 13, NULL, '::1', '2026-05-02 06:20:35'),
(39, NULL, 'SUBMIT_APP', 'Application', 6, NULL, '::1', '2026-05-02 06:21:47'),
(40, NULL, 'LOGIN', 'User', 13, NULL, '::1', '2026-05-02 06:22:05'),
(41, 2, 'LOGIN', 'User', 2, NULL, '::1', '2026-05-02 06:23:11'),
(42, 2, 'VALIDATOR_APPROVE', 'Application', 2, NULL, '::1', '2026-05-02 06:24:10'),
(43, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-05-02 06:24:36'),
(44, 4, 'JURY_APPROVE', 'Application', 2, NULL, '::1', '2026-05-02 06:26:14'),
(45, NULL, 'LOGIN', 'User', 13, NULL, '::1', '2026-05-02 06:26:38'),
(46, NULL, 'REGISTER', 'User', 14, NULL, '::1', '2026-05-02 17:48:53'),
(47, NULL, 'CREATE_APP', 'Application', 9, NULL, '::1', '2026-05-02 17:48:54'),
(48, NULL, 'CREATE_APP', 'Application', 8, NULL, '::1', '2026-05-02 17:48:54'),
(49, NULL, 'SUBMIT_APP', 'Application', 8, NULL, '::1', '2026-05-02 17:49:35'),
(50, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 17:58:29'),
(51, 3, 'VALIDATOR_APPROVE', 'Application', 8, NULL, '::1', '2026-05-02 17:59:20'),
(52, NULL, 'REGISTER', 'User', 15, NULL, '::1', '2026-05-02 18:00:57'),
(53, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:01:20'),
(54, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 18:03:04'),
(55, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: manoj@gmail.com', '::1', '2026-05-02 18:03:18'),
(56, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: manoj@gmail.com', '::1', '2026-05-02 18:03:38'),
(57, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: manoj@gmail.com', '::1', '2026-05-02 18:03:50'),
(58, NULL, 'LOGIN', 'User', 14, NULL, '::1', '2026-05-02 18:04:14'),
(59, NULL, 'LOGIN', 'User', 14, NULL, '::1', '2026-05-02 18:04:31'),
(60, NULL, 'LOGIN', 'User', 14, NULL, '::1', '2026-05-02 18:07:12'),
(61, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 18:08:55'),
(62, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 18:11:22'),
(63, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 18:16:07'),
(64, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-05-02 18:20:01'),
(65, 4, 'JURY_APPROVE', 'Application', 8, NULL, '::1', '2026-05-02 18:20:40'),
(66, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-05-02 18:21:24'),
(67, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 18:33:47'),
(68, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-05-02 18:34:21'),
(69, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: test@gmail.com', '::1', '2026-05-02 18:34:56'),
(70, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: test@gmail.com', '::1', '2026-05-02 18:35:02'),
(71, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:35:24'),
(72, NULL, 'CREATE_APP', 'Application', 10, NULL, '::1', '2026-05-02 18:35:25'),
(73, NULL, 'CREATE_APP', 'Application', 11, NULL, '::1', '2026-05-02 18:35:25'),
(74, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: test@gmail.com', '::1', '2026-05-02 18:35:37'),
(75, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:35:40'),
(76, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: test@gmail.com', '::1', '2026-05-02 18:36:54'),
(77, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:36:57'),
(78, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: test@gmail.com', '::1', '2026-05-02 18:48:01'),
(79, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: test@gmail.com', '::1', '2026-05-02 18:48:06'),
(80, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:48:26'),
(81, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:53:15'),
(82, NULL, 'LOGIN', 'User', 15, NULL, '::1', '2026-05-02 18:55:40'),
(83, NULL, 'LOGIN', 'User', 14, NULL, '::1', '2026-05-02 18:56:12'),
(84, NULL, 'LOGIN', 'User', 14, NULL, '::1', '2026-06-04 12:13:14'),
(85, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-06-04 12:13:37'),
(86, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-06-04 12:26:35'),
(87, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: jury1@oppi.com', '::1', '2026-06-04 12:27:41'),
(88, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-06-04 12:28:02'),
(89, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-06-04 12:28:16'),
(90, 3, 'VALIDATOR_APPROVE', 'Application', 6, NULL, '::1', '2026-06-04 12:28:20'),
(91, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-06-04 12:28:25'),
(92, 4, 'JURY_APPROVE', 'Application', 6, NULL, '::1', '2026-06-04 12:28:45'),
(93, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-06-04 12:29:25'),
(94, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: admin@xyz.com', '::1', '2026-06-04 12:33:51'),
(95, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-06-04 12:34:07'),
(96, NULL, 'REGISTER', 'User', 16, NULL, '::1', '2026-06-04 12:38:37'),
(97, NULL, 'LOGIN', 'User', 16, NULL, '::1', '2026-06-04 12:38:47'),
(98, NULL, 'LOGIN', 'User', 16, NULL, '::1', '2026-06-04 12:44:57'),
(99, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: testt@gmail.com', '::1', '2026-06-04 12:46:46'),
(100, 17, 'REGISTER', 'User', 17, NULL, '::1', '2026-06-04 12:47:30'),
(101, 17, 'LOGIN', 'User', 17, NULL, '::1', '2026-06-04 12:47:41'),
(102, 17, 'LOGIN', 'User', 17, NULL, '::1', '2026-06-04 12:50:36'),
(103, 17, 'LOGIN', 'User', 17, NULL, '::1', '2026-06-04 12:53:50'),
(104, 17, 'LOGIN', 'User', 17, NULL, '::1', '2026-06-04 12:55:36'),
(105, 18, 'REGISTER', 'User', 18, NULL, '::1', '2026-06-09 07:01:42'),
(106, 18, 'LOGIN', 'User', 18, NULL, '::1', '2026-06-09 07:01:52'),
(107, 18, 'CREATE_APP', 'Application', 1, NULL, '::1', '2026-06-09 07:03:20'),
(108, 18, 'SUBMIT_APP', 'Application', 1, NULL, '::1', '2026-06-09 07:05:06'),
(109, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-06-09 07:06:54'),
(110, 3, 'VALIDATOR_APPROVE', 'Application', 1, NULL, '::1', '2026-06-09 07:07:27'),
(111, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-06-09 07:07:42'),
(112, 4, 'JURY_APPROVE', 'Application', 1, NULL, '::1', '2026-06-09 07:08:33'),
(113, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-06-09 07:09:10'),
(114, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-06-09 07:29:09'),
(115, 4, 'JURY_APPROVE', 'Application', 1, 'Scores: IP=4, Team=5, Biz=3, Impact=4, Weighted=4', '::1', '2026-06-09 07:29:34'),
(116, 5, 'LOGIN', 'User', 5, NULL, '::1', '2026-06-09 07:30:11'),
(117, 5, 'JURY_APPROVE', 'Application', 1, 'Scores: IP=4, Team=5, Biz=4, Impact=4, Weighted=4.25', '::1', '2026-06-09 07:30:19'),
(118, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-06-09 07:30:33'),
(119, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: admin@xyz.com', '::1', '2026-06-09 07:32:21'),
(120, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-06-09 07:32:37'),
(121, 19, 'REGISTER', 'User', 19, NULL, '::1', '2026-06-09 07:34:00'),
(122, 19, 'LOGIN', 'User', 19, NULL, '::1', '2026-06-09 07:34:09'),
(123, 19, 'CREATE_APP', 'Application', 2, NULL, '::1', '2026-06-09 07:34:30'),
(124, 19, 'SUBMIT_APP', 'Application', 2, NULL, '::1', '2026-06-09 07:36:08'),
(125, 3, 'LOGIN', 'User', 3, NULL, '::1', '2026-06-09 07:36:19'),
(126, 3, 'VALIDATOR_APPROVE', 'Application', 2, NULL, '::1', '2026-06-09 07:36:22'),
(127, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: jury1@oppi.com', '::1', '2026-06-09 07:36:27'),
(128, 4, 'LOGIN', 'User', 4, NULL, '::1', '2026-06-09 07:36:38'),
(129, 4, 'JURY_APPROVE', 'Application', 2, 'Scores: IP=3, Team=4, Biz=3, Impact=3, Weighted=3.25', '::1', '2026-06-09 07:38:17'),
(130, 5, 'LOGIN', 'User', 5, NULL, '::1', '2026-06-09 07:38:37'),
(131, 5, 'JURY_APPROVE', 'Application', 2, 'Scores: IP=4, Team=4, Biz=4, Impact=4, Weighted=4', '::1', '2026-06-09 07:38:44'),
(132, 6, 'LOGIN', 'User', 6, NULL, '::1', '2026-06-09 07:38:50'),
(133, NULL, 'LOGIN_FAILED', NULL, NULL, 'Email: admin@xyz.com', '127.0.0.1', '2026-06-13 08:30:25'),
(134, 6, 'LOGIN', 'User', 6, NULL, '127.0.0.1', '2026-06-13 08:30:29');

-- --------------------------------------------------------

--
-- Table structure for table `company_details`
--

CREATE TABLE `company_details` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `customer_benefit` text COLLATE utf8mb4_unicode_ci,
  `testimonial` text COLLATE utf8mb4_unicode_ci,
  `employee_count` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `board_of_directors` text COLLATE utf8mb4_unicode_ci,
  `investors_details` text COLLATE utf8mb4_unicode_ci,
  `media_mentions` text COLLATE utf8mb4_unicode_ci,
  `patents` text COLLATE utf8mb4_unicode_ci,
  `product_benefits` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_details`
--

INSERT INTO `company_details` (`id`, `application_id`, `customer_benefit`, `testimonial`, `employee_count`, `board_of_directors`, `investors_details`, `media_mentions`, `patents`, `product_benefits`) VALUES
(1, 1, 'test', 'test', '2', 'test', 'test', 'test', NULL, 'test'),
(2, 2, 'test', 'test', '1', 'test', 'test', 'test', 'test', 'test');

-- --------------------------------------------------------

--
-- Table structure for table `company_reach`
--

CREATE TABLE `company_reach` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `marketing_strategy` text COLLATE utf8mb4_unicode_ci,
  `app_details` text COLLATE utf8mb4_unicode_ci,
  `website_details` text COLLATE utf8mb4_unicode_ci,
  `social_media` text COLLATE utf8mb4_unicode_ci,
  `physical_outlets` text COLLATE utf8mb4_unicode_ci,
  `future_expansion` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_reach`
--

INSERT INTO `company_reach` (`id`, `application_id`, `marketing_strategy`, `app_details`, `website_details`, `social_media`, `physical_outlets`, `future_expansion`) VALUES
(1, 1, 'test', 'test', 'test', 'test', 'test', '2'),
(2, 2, 'test', 'test', 'test', 'test', 'test', '2');

-- --------------------------------------------------------

--
-- Table structure for table `file_uploads`
--

CREATE TABLE `file_uploads` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `section` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `file_uploads`
--

INSERT INTO `file_uploads` (`id`, `application_id`, `section`, `file_name`, `file_path`, `file_size`, `file_type`, `created_at`) VALUES
(1, 1, 'ReachDocs', 'clearhissab.png', '/uploads/1/0f2b52d1-df8c-46bc-86f1-92aa8a3d5070.png', 228802, '.png', '2026-06-09 07:03:45'),
(2, 1, 'ReachDocs', 'aadharcard1.jpeg', '/uploads/1/514bceb3-6297-419e-8b4a-675c825f158d.jpeg', 166466, '.jpeg', '2026-06-09 07:04:26'),
(3, 1, 'Testimonial', 'aadharcard2.jpeg', '/uploads/1/3affce04-f228-4023-8390-9190f6c0a73a.jpeg', 137290, '.jpeg', '2026-06-09 07:04:51'),
(4, 1, 'Board', 'clearhissab.png', '/uploads/1/1609b5de-7d7e-491d-83e6-d02eb902e627.png', 228802, '.png', '2026-06-09 07:04:51'),
(5, 2, 'ReachDocs', 'aadharcard1.jpeg', '/uploads/2/bbc1f485-7d7f-4264-a0d9-65af7ebaf9c0.jpeg', 166466, '.jpeg', '2026-06-09 07:34:45'),
(6, 2, 'Testimonial', 'aadharcard2.jpeg', '/uploads/2/38b2067c-a1a5-4fd6-b160-14fead617b7b.jpeg', 137290, '.jpeg', '2026-06-09 07:36:06'),
(7, 2, 'Board', 'aadharcard2.jpeg', '/uploads/2/14b2b564-3828-4d74-9352-7e0f615ce06a.jpeg', 137290, '.jpeg', '2026-06-09 07:36:06');

-- --------------------------------------------------------

--
-- Table structure for table `jury_reviews`
--

CREATE TABLE `jury_reviews` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `jury_id` int(11) NOT NULL,
  `innovation_ip_score` int(11) NOT NULL,
  `team_strength_score` int(11) NOT NULL,
  `business_plan_score` int(11) NOT NULL,
  `impact_score` int(11) NOT NULL,
  `weighted_score` double NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `validator_reviews`
--

CREATE TABLE `validator_reviews` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `validator_id` int(11) NOT NULL,
  `innovation_ip_score` int(11) NOT NULL,
  `team_strength_score` int(11) NOT NULL,
  `business_plan_score` int(11) NOT NULL,
  `impact_score` int(11) NOT NULL,
  `weighted_score` double NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jury_reviews`
--

INSERT INTO `jury_reviews` (`id`, `application_id`, `jury_id`, `innovation_ip_score`, `team_strength_score`, `business_plan_score`, `impact_score`, `weighted_score`, `created_at`) VALUES
(1, 1, 4, 4, 5, 3, 4, 4, '2026-06-09 07:29:33'),
(2, 1, 5, 4, 5, 4, 4, 4.25, '2026-06-09 07:30:18'),
(3, 2, 4, 3, 4, 3, 3, 3.25, '2026-06-09 07:38:17'),
(4, 2, 5, 4, 4, 4, 4, 4, '2026-06-09 07:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `personal_info`
--

CREATE TABLE `personal_info` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_of_work` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `other_category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_website` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_brief` text COLLATE utf8mb4_unicode_ci,
  `innovation` text COLLATE utf8mb4_unicode_ci,
  `competitive_analysis` text COLLATE utf8mb4_unicode_ci,
  `need_analysis` text COLLATE utf8mb4_unicode_ci,
  `marketability` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_info`
--

INSERT INTO `personal_info` (`id`, `application_id`, `company_name`, `designation`, `category_of_work`, `other_category`, `company_website`, `company_brief`, `innovation`, `competitive_analysis`, `need_analysis`, `marketability`) VALUES
(1, 1, 'Gmail.com', 'DEveloper', 'IT', NULL, 'gmail.com', 'IT', 'Product', 'test', 'test', 'test'),
(2, 2, 'da', 'IR', 'IT', NULL, 'gmail.com', 'gmail.com', 'test', 'test', 'test', 'test');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  `device_info` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`, `revoked_at`, `device_info`) VALUES
(4, 2, 'KxdBfC+SAV8oH8wsIr9/QDHiMqx/fMrg/CYwZ0vSBBFfDoHCgHJK3S5fiBybuBbJdIxT8ow3H9tPPRKMC9GUJQ==', '2026-05-31 10:59:10', '2026-05-01 10:59:10', '2026-05-01 19:05:10', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456'),
(5, 4, 'lyvJBF6JpaR0KF9TbolQQyETUsdT1TWZybyuQuZqSIamHJ6zbpZufrhj7c46grgs0D9qMkffdD4e5D9g/xgC1Q==', '2026-05-31 10:59:20', '2026-05-01 10:59:20', '2026-05-02 05:19:23', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6456'),
(32, 2, 'yK+gFzKmL/WHkbYKdoKdBchZ6J/ZNoKYKsDcfvaWPoBnOce5OK9zYe8skDpRxz8nnutnLf9vWmqo3RNeVZAo1w==', '2026-05-31 19:05:10', '2026-05-01 19:05:10', '2026-05-02 05:19:52', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(33, 4, 'MHPwa+QyZL+uUQXzA62V4+nmaPfxjWlWzo/csKiUJG4YheSpQsOgN7dch1hKG9mZbwhoRqBPjiOi3hJnuZRpRA==', '2026-06-01 05:19:23', '2026-05-02 05:19:23', '2026-05-02 06:24:36', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(34, 2, 'TlH3Jmoe0EHj7Sun0dJzzOicgTRHwvRcEurJvmuzTUl58QOyJFf21+hUrxCiNnCcbG/O4aHL9MsSPZZCo+NDaQ==', '2026-06-01 05:19:52', '2026-05-02 05:19:52', '2026-05-02 06:04:37', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(35, 2, 'O2S7QFTBQJVFANNCRQmPXskvSRllQadr5hP2zSvUlmmSvPosxYN4O6RNBC+xm+NjlDbymzWEB40NeY4TgRB0RA==', '2026-06-01 06:04:37', '2026-05-02 06:04:37', '2026-05-02 06:05:11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(36, 2, 'b0Qk8kxJ9Tf4NqjE5bZTcFbw+9eIU7jgxEUr9vWRJEY8Rsk3laS3D47Ku1A7m7aBdzqYvNjWoxOoWjFWL+IB0g==', '2026-06-01 06:05:11', '2026-05-02 06:05:11', '2026-05-02 06:23:11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(41, 2, 'A9NP3AvIFfQJNCSmyJC/eeXiLUlwRnrQYCmpl8xYWtuAF3/yZEJjRnT/32KWZDMlZEcVmhobwo5TM+EhgHpt/w==', '2026-06-01 06:23:11', '2026-05-02 06:23:11', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(42, 4, '1GUD64BRBot7nUzdwriDCaW33zoOfHlUDohDFQO6AFa4CtV2PFt3EUkvV+YFG3+XM5Uh+4lm8NDshMJuo+ar5A==', '2026-06-01 06:24:36', '2026-05-02 06:24:36', '2026-05-02 18:20:01', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(45, 3, 'MAlklhnUa5N9+zkgtHhVnEAeQWrcHcUdiaekfhg0LZaee0kIXgLKVOfKUA6Hqft/eoy4p61tedZ+Oa7OSluT/Q==', '2026-06-01 17:58:29', '2026-05-02 17:58:29', '2026-05-02 18:03:04', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(48, 3, 'dJaPJnJBYfdo1cnc/78AMjmmGF+C3SyUuwXSX0xLY+dO9/ZaID6Ta+QXXlJlKYw0S4f67+hUI3CM1KxQP0XizA==', '2026-06-01 18:03:04', '2026-05-02 18:03:04', '2026-05-02 18:08:55', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(52, 3, 'seEdrLjJDvdj0AkOzooWF/0VADVvDNl0sf2YDFBagkZs4KCU0YT5w2ey29pcy2aHZhJS1Z0/aGlcQZzJR+UrFw==', '2026-06-01 18:08:55', '2026-05-02 18:08:55', '2026-05-02 18:11:21', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(53, 3, 'nCAa+AO6STNWYinO7skNVBcgzEE5sSPirD0fjFhsL8/ra+BhX8ltlxI3HvL7tNV8HiTOl0bs8EXpifKqxOg3yw==', '2026-06-01 18:11:21', '2026-05-02 18:11:21', '2026-05-02 18:16:07', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(54, 3, 'xI6Ky/LY9cD27ih7LtC4EEXEnKMaBeyaC2hPiEJCFq5i5203SCyVCF4VdwCExcEv00HbI8A75YAOEC+elvGOyw==', '2026-06-01 18:16:07', '2026-05-02 18:16:07', '2026-05-02 18:33:47', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(55, 4, 'JEmqRrYv3h/31A/20TNFErvo7E6x1lAWhN1fec/J6UEYl8e4VaFxzaALXFytMC4jAcghoVYjRpaHG7ONH7aEYA==', '2026-06-01 18:20:01', '2026-05-02 18:20:01', '2026-06-04 12:28:02', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(56, 6, 'nULxiCbcZlWBIzEYVo1EGhF1WG4VWewhMpXS18snioH36dDeOccRxfFiJyi5v6lD1VZ5BEV59V5teJ/p+gWyUQ==', '2026-06-01 18:21:24', '2026-05-02 18:21:24', '2026-06-04 12:29:25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(57, 3, 'CchA6LoWEg2wfImpXJsWX2JF2lgvn/lc4bf8h/5T0bvI2TSKQcj984djzLOon+D5IJ5uSj7+TSkI3qEbCCzMvw==', '2026-06-01 18:33:47', '2026-05-02 18:33:47', '2026-05-02 18:34:21', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(58, 3, 'hm131xRAh2X6jzTJgO0jIq/izb13SzU22Al5w+8uSVLmHAoE1Jp0Iv2Yo9aApdOZKgIPZcAhjogOhEjCRIVXiA==', '2026-06-01 18:34:21', '2026-05-02 18:34:21', '2026-06-04 12:13:37', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'),
(67, 3, 'xu2RifwT2WqQnl68+zhBpCkMt7a0w2esOQyZ7ofXSfRHTZgoR1FRYPO48z3z9OiaKAGlfvfX92DbaLxi1DrAcw==', '2026-07-04 12:13:37', '2026-06-04 12:13:37', '2026-06-04 12:26:35', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(68, 3, 'etyIS8WEHYChcl2dm2Yo92TSSTqxpR8rYuyeMk7yjimS4l6c/0CJs7wXTTy7ON+fFy0wZd6vqYy9OzYUJAkReQ==', '2026-07-04 12:26:35', '2026-06-04 12:26:35', '2026-06-04 12:28:16', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(69, 4, 'SJP5LKGO4sJCs3lbnuuW/7rUnQwgQvu4m5+hkzZ0v26tBF7Vq0J6J4YHUFBjGAGxnktmNeydi24nWVmufyjRzw==', '2026-07-04 12:28:02', '2026-06-04 12:28:02', '2026-06-04 12:28:25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(70, 3, '1WPckwT+r3pIzeNXq/entMWvz+TTsLxzs5+hBevHN4I9bgPiffQ+qmGDFcd1leuccx6R1uQ9UGVaCUV0siRPLw==', '2026-07-04 12:28:16', '2026-06-04 12:28:16', '2026-06-09 07:06:54', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(71, 4, 'ngoFvZfV8yw8KA6xJXvSAijIuMhVo6a4wqRuDv7e4iRm/Tq4SM70loLNJn6xp6c/Gz4LXyVpKpUZaUY2jxITWw==', '2026-07-04 12:28:25', '2026-06-04 12:28:25', '2026-06-09 07:07:42', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(72, 6, 'BoboJ8vsftzV1BtO83ORx7kNynWn6mBvjw/psna02OCiPWu6KKiAMBTMKiNXy6G8zddKbtE+Hr9i1RiDyyqxTA==', '2026-07-04 12:29:25', '2026-06-04 12:29:25', '2026-06-04 12:34:06', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(73, 6, 'VcnLC/lWtcCdHJDrGW7IBY5jqnF/trEude9naCZudw4PpvkYG2bydTv70vxfblpHSInnOPISsp7gE1Ie9UTrhg==', '2026-07-04 12:34:06', '2026-06-04 12:34:06', '2026-06-09 07:09:10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(77, 17, 'T0HqQ3HwqvvjXnO+LttZJ4kUiKvGnSTQhCcNHC2TBe1ft7r3J5xVN1wJb3hyECrnY1KSU3DyWrFKR6CpFFXaHQ==', '2026-07-04 12:47:30', '2026-06-04 12:47:30', '2026-06-04 12:47:41', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(78, 17, 'nimENHy6OqEhs3ngAbalN1A0ZISt8XPaID854/Wqi40pkDtcHe6mwgGy8yTfT62rPvLeepApLMAuls+wyqcErw==', '2026-07-04 12:47:41', '2026-06-04 12:47:41', '2026-06-04 12:50:36', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(79, 17, 'gNrYPS0YgPaUJ1gQLzBW/QXuHkdU0+m4lwSRNCSDW1RAORW5jfFse2wi2xbIMkpCQF+nvilWkCLQ4xXtfJG4bg==', '2026-07-04 12:50:36', '2026-06-04 12:50:36', '2026-06-04 12:53:50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(80, 17, 'ORt6tE0rfJCMLJsyudiAp4Q6JAuVn0p27vL9B/nt9DUP359mo/kRpwvnH94fqjMaZ/PxsxrORbpRfKhMhIqAAg==', '2026-07-04 12:53:50', '2026-06-04 12:53:50', '2026-06-04 12:55:36', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(81, 17, 'n1YmTp+GNi7ynjERcA5nlzbyBLYNfMrGfOJ8W7+CV4SCb+DAXDtzu5n32icQEk9PgXFtbfUyqaZlZqYvjc7uHA==', '2026-07-04 12:55:36', '2026-06-04 12:55:36', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(82, 18, 'IiNfLzgBOJDC9N7nMYpEA1x4ND7gmaePRdxGm0ixgUQFReISDAMuBg1IYz/uCHw2lSjJHxDQfxXCb0qzdJLtbg==', '2026-07-09 07:01:42', '2026-06-09 07:01:42', '2026-06-09 07:01:52', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(83, 18, '/uiW0bE0br9ijMp9mrtWU+dBRcyyJ8bdY1nqfxu2Rb/D5yxYcnDAmlHKHxxzYA7edJP69oIgV9L+pSFncXFeRA==', '2026-07-09 07:01:52', '2026-06-09 07:01:52', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(84, 3, '/sAo65P33LlvbzMLsmrtKevBBP7gyARK8QfZ074J2DXWRemUHjaPI43k9fu91aL0T7cxq7pAFG8Zask9sL0Kgw==', '2026-07-09 07:06:54', '2026-06-09 07:06:54', '2026-06-09 07:36:18', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(85, 4, 'xwxyZpFPVmGenk5YFtSV7ijENYhp2UoHFu8AjZD8Y5OE2nj9TLaMcGcHkF5wh7QPKFfII9cvbS39VIUJowrHyA==', '2026-07-09 07:07:42', '2026-06-09 07:07:42', '2026-06-09 07:29:09', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(86, 6, '81ZspiSvaa29OJ0ItN4hxO0S7sieTt7ORrwFC2CdqXrus6G+iHE/i3mr1nlCBOSdE93katO8DhTp3yYQ5dmvJw==', '2026-07-09 07:09:10', '2026-06-09 07:09:10', '2026-06-09 07:30:33', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(87, 4, '9eUrX3fxpqPfatooxMW49MDS509quEd6PifocpChU5sYKCpvdeduxcivKxtNQL5lMQfZwOr0VxAHuKGgNZ3l3g==', '2026-07-09 07:29:09', '2026-06-09 07:29:09', '2026-06-09 07:36:38', 'curl/8.7.1'),
(88, 5, 'xx3XNB/+6ZwT3CQkcD9n082wrjGLa6+CyTc87fB6TpQ0zJTxvAqwPRFXLHDmtFxNFLSIcJrkUgB6qdrL6ti2sw==', '2026-07-09 07:30:11', '2026-06-09 07:30:11', '2026-06-09 07:38:36', 'curl/8.7.1'),
(89, 6, 'ZCIP3opdOwS+RWDG037tlrdfGTkuPzU/zKr+cZ483CwUybIE2oD6JGuA8WEJ4WE7Truuh6nlZ6ao0EoYOS0LjQ==', '2026-07-09 07:30:33', '2026-06-09 07:30:33', '2026-06-09 07:32:37', 'curl/8.7.1'),
(90, 6, 'A5qYmjxwypQwJPcVIGLhe4cE83DZWG3VP3O6tpX3BMWztnNiuDeQ2QuC86U90QAlbZAGzCnkd8Yzqso3wxXcxA==', '2026-07-09 07:32:37', '2026-06-09 07:32:37', '2026-06-09 07:38:50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(91, 19, '4QaManXHO+QkE/Bg+89DOuFdQ0a2hQYYt9dmDfEbMGAHDQRj3lZsslLoPy0PXj49Z+JBET4S5+GOizEkgZgRLA==', '2026-07-09 07:33:59', '2026-06-09 07:33:59', '2026-06-09 07:34:09', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(92, 19, 'CjROsop6lbnvMYszF+IX7jsl2EzknfA0kVtD8g4kO9oQy1UoETlWhpKB83At3rloUY56/1BC2w4RD/uFbEYIVQ==', '2026-07-09 07:34:09', '2026-06-09 07:34:09', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(93, 3, 'KhdoUGsGtGlvwV6tRhZD6WxJC2Z6QWZMXpLcLUOsnyqxReik7511AGhoPqMnpncsz1J879t4URfCgxUe1Ptg1g==', '2026-07-09 07:36:18', '2026-06-09 07:36:18', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(94, 4, 'YTJF7fkt5SSAc75rDUiDqGzTCDt+twwk07EK+7pZtrhPjqDzAirTiVlAH9miQr76FgIrlR7Vo673vhCRo2H6cQ==', '2026-07-09 07:36:38', '2026-06-09 07:36:38', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(95, 5, 'KjiXHwVyfpedHmvseDXZ+E/58A+OqjT4irdImP3WdoCHcd2uMHhWco7T70k0hjVH8A0L7lrsen+MDjIod88s5Q==', '2026-07-09 07:38:36', '2026-06-09 07:38:36', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(96, 6, 'wg0lmore8UDSM9km34VLDrAASOfbSFqGCal1e5jISbTzX97hr5sL10VaVEbSAkPtRHEGTidUYzQYWPn7UGY6kQ==', '2026-07-09 07:38:50', '2026-06-09 07:38:50', '2026-06-13 08:30:29', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(97, 6, 'NMP5VrWYZGNdPfHVOwF8Tiy1VLnp4fdfoI2BZDEUqE+eOtvfkhLULMQXwJA/oQXiHE2At4mXU6nKV65BQBQ+8A==', '2026-07-13 08:30:29', '2026-06-13 08:30:29', NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','VALIDATOR','JURY','ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT 'USER',
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `mobile`, `password_hash`, `role`, `is_active`, `is_deleted`, `created_at`) VALUES
(2, 'Shrey', 'Validator', 'shrey@oppi.com', '9999999991', '$2a$11$DzLw9ZXcEUxR7zEyTso0w.ZvWcq1SU9LQzhEts40Pk8rRKOR6wI5O', 'VALIDATOR', 1, 0, '2026-05-01 10:57:49'),
(3, 'Shivam', 'Validator', 'shivam@oppi.com', '9999999992', '$2a$11$ZQC4UB.AyLvcEbLdU5tGI.I1kY6BhxQIWoygEY.94paRJ06a.2kSW', 'VALIDATOR', 1, 0, '2026-05-01 10:57:49'),
(4, 'Jury', 'One', 'jury1@oppi.com', '9999999993', '$2a$11$Lc.Ibd3z.iEYxp0hQUhGnOKUWLDg1vJa8DQiz2gPtd6PNzxjjk5JC', 'JURY', 1, 0, '2026-05-01 10:57:49'),
(5, 'Jury', 'Two', 'jury2@oppi.com', '9999999994', '$2a$11$ra1Y76ll2lgSa4SoO8W/quENrf4CrE0sSPrBRjiZd3rJEstCyTpha', 'JURY', 1, 0, '2026-05-01 10:57:49'),
(6, 'Admin', 'User', 'admin@xyz.com', '9999999999', '$2a$11$25pcnjH6hPt/yqIFhGPenuwzERjQlqgH90oNcvDrANVbu/ekw0iKy', 'ADMIN', 1, 0, '2026-05-01 17:46:59'),
(17, 'manoj', 'kumar', 'manoj@gmail.com', '8753223878', '$2a$11$Lpr2FKWplS5I1rRlzID0RuylcMxHQBf0jUZBVBcr6r1ro3of6IQzq', 'USER', 1, 0, '2026-06-04 12:47:30'),
(18, 'test', 'Kumar', 'testttt@gmail.com', '8218573836', '$2a$11$B/6dyeCEINkbblt2NihdQ.p6fJ6XaY3S.ZWtF5msnCkLexxHkD2NG', 'USER', 1, 0, '2026-06-09 07:01:42'),
(19, 'test', 'test', 'test@gmail.com', '3322334454', '$2a$11$SpwfcaCdIUINXmvCXrdG4.K4XTtaQ61CAanz7pALRKwRH0cwNkPx2', 'USER', 1, 0, '2026-06-09 07:33:59');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `allowed_domains`
--
ALTER TABLE `allowed_domains`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_domain` (`domain`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `company_details`
--
ALTER TABLE `company_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_id` (`application_id`);

--
-- Indexes for table `company_reach`
--
ALTER TABLE `company_reach`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_id` (`application_id`);

--
-- Indexes for table `file_uploads`
--
ALTER TABLE `file_uploads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_app_section` (`application_id`,`section`);

--
-- Indexes for table `jury_reviews`
--
ALTER TABLE `jury_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_app_jury` (`application_id`,`jury_id`),
  ADD KEY `fk_jury_reviews_jury` (`jury_id`);

--
-- Indexes for table `validator_reviews`
--
ALTER TABLE `validator_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_app_validator` (`application_id`,`validator_id`),
  ADD KEY `fk_validator_reviews_validator` (`validator_id`);

--
-- Indexes for table `personal_info`
--
ALTER TABLE `personal_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_id` (`application_id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_token` (`token`(255)),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `allowed_domains`
--
ALTER TABLE `allowed_domains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;
--
-- AUTO_INCREMENT for table `company_details`
--
ALTER TABLE `company_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `company_reach`
--
ALTER TABLE `company_reach`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `file_uploads`
--
ALTER TABLE `file_uploads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `jury_reviews`
--
ALTER TABLE `jury_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `validator_reviews`
--
ALTER TABLE `validator_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `personal_info`
--
ALTER TABLE `personal_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `company_details`
--
ALTER TABLE `company_details`
  ADD CONSTRAINT `company_details_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_reach`
--
ALTER TABLE `company_reach`
  ADD CONSTRAINT `company_reach_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `file_uploads`
--
ALTER TABLE `file_uploads`
  ADD CONSTRAINT `file_uploads_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jury_reviews`
--
ALTER TABLE `jury_reviews`
  ADD CONSTRAINT `fk_jury_reviews_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_jury_reviews_jury` FOREIGN KEY (`jury_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `validator_reviews`
--
ALTER TABLE `validator_reviews`
  ADD CONSTRAINT `fk_validator_reviews_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_validator_reviews_validator` FOREIGN KEY (`validator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `personal_info`
--
ALTER TABLE `personal_info`
  ADD CONSTRAINT `personal_info_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
