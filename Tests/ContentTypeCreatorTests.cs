﻿using Cloudy.CMS.ComponentSupport;
using Microsoft.Extensions.Logging;
using Moq;
using Poetry.ComponentSupport;
using Poetry.ComponentSupport.DuplicateComponentIdCheckerSupport;
using Poetry.ComponentSupport.MissingComponentAttributeCheckerSupport;
using Poetry.ComponentSupport.MultipleComponentsInSingleAssemblyCheckerSupport;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using Xunit;

namespace Tests
{
    public class ContentTypeCreatorTests
    {
        [Fact]
        public void UsesAssemblyNameForAssemblyComponent()
        {
            var componentAssemblyProvider = Mock.Of<IComponentAssemblyProvider>();

            Mock.Get(componentAssemblyProvider).Setup(c => c.GetAll()).Returns(new List<Assembly> { Assembly.GetExecutingAssembly() });

            Assert.Equal("Tests", new ComponentCreator(Mock.Of<ILogger<ComponentCreator>>(), Mock.Of<IComponentTypeProvider>(), componentAssemblyProvider, Mock.Of<IMissingComponentAttributeChecker>(), Mock.Of<IMultipleComponentsInSingleAssemblyChecker>(), Mock.Of<IDuplicateComponentIdChecker>()).Create().Single().Id);
        }
    }
}
