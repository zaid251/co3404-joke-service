-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: localhost    Database: jokesdb
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `jokes`
--

DROP TABLE IF EXISTS `jokes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jokes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setup` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `punchline` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_joke_type` (`type_id`),
  CONSTRAINT `fk_joke_type` FOREIGN KEY (`type_id`) REFERENCES `types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jokes`
--

LOCK TABLES `jokes` WRITE;
/*!40000 ALTER TABLE `jokes` DISABLE KEYS */;
INSERT INTO `jokes` VALUES (1,'Why don\'t scientists trust atoms?','Because they make up everything!',1,'2026-03-07 14:08:13'),(2,'I\'m reading a book about anti-gravity.','It\'s impossible to put down!',1,'2026-03-07 14:08:13'),(3,'Why did the scarecrow win an award?','Because he was outstanding in his field!',1,'2026-03-07 14:08:13'),(4,'What do you call a fake noodle?','An impasta!',1,'2026-03-07 14:08:13'),(5,'Why did the bicycle fall over?','Because it was two-tired!',1,'2026-03-07 14:08:13'),(6,'I used to hate facial hair...','But then it grew on me.',2,'2026-03-07 14:08:13'),(7,'Why did the dad bring a ladder to the bar?','Because he heard the drinks were on the house!',2,'2026-03-07 14:08:13'),(8,'I\'m on a seafood diet.','I see food and I eat it.',2,'2026-03-07 14:08:13'),(9,'Why do programmers prefer dark mode?','Because light attracts bugs!',3,'2026-03-07 14:08:13'),(10,'How many programmers does it take to change a lightbulb?','None, that\'s a hardware problem!',3,'2026-03-07 14:08:13'),(11,'Why did the programmer quit his job?','Because he didn\'t get arrays!',3,'2026-03-07 14:08:13'),(12,'A SQL query walks into a bar.','Walks up to two tables and asks: \'Can I JOIN you?\'',3,'2026-03-07 14:08:13'),(13,'Knock knock. Who\'s there? Lettuce.','Lettuce in, it\'s cold out here!',4,'2026-03-07 14:08:13'),(14,'Knock knock. Who\'s there? Cow says.','Cow says who? No silly, cow says moo!',4,'2026-03-07 14:08:13'),(15,'Why can\'t Cinderella play soccer?','Because she always runs away from the ball!',5,'2026-03-07 14:08:13'),(16,'Why do golfers carry an extra pair of pants?','In case they get a hole in one!',5,'2026-03-07 14:08:13');
/*!40000 ALTER TABLE `jokes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `types`
--

DROP TABLE IF EXISTS `types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_type_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `types`
--

LOCK TABLES `types` WRITE;
/*!40000 ALTER TABLE `types` DISABLE KEYS */;
INSERT INTO `types` VALUES (2,'dad'),(1,'general'),(4,'knock-knock'),(3,'programming'),(5,'sport');
/*!40000 ALTER TABLE `types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-15  1:36:30
